import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { PrismaService } from 'src/prisma.service';
import { DeepSeekService, ParsedResumeResult } from 'src/utils/deepseek.service';
import { join, basename } from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

export interface MigrationFileResult {
  key: string;
  filename: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  extractedData?: ParsedResumeResult;
  error?: string;
  r2JsonPath?: string;
  candidateId?: string;
}

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);
  private s3Client: S3Client;
  private bucketName: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly deepSeekService: DeepSeekService,
  ) {
    this.bucketName = process.env.S3_BUCKET || 'toptalent';
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Process all PDFs in toptalent/migration folder
   */
  async processR2Migration(folderPrefix = `${process.env.S3_MIGRATION_FOLDER}/`): Promise<{
    totalPDFs: number;
    processed: number;
    successful: number;
    failed: number;
    results: MigrationFileResult[];
  }> {
    this.logger.log(
      `Starting R2 Migration for bucket: "${this.bucketName}", folder: "${folderPrefix}"`,
    );

    const pdfKeys = await this.listPDFsInFolder(folderPrefix);
    this.logger.log(`Found ${pdfKeys.length} PDF files in R2 "${folderPrefix}" folder.`);

    const results: MigrationFileResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const key of pdfKeys) {
      this.logger.log(`---> Processing PDF: ${key}`);
      try {
        const fileResult = await this.processSinglePDF(key);
        results.push(fileResult);
        if (fileResult.status === 'SUCCESS') {
          successful++;
        } else {
          failed++;
        }
      } catch (err: any) {
        this.logger.error(`Error processing PDF key "${key}":`, err?.message || err);
        failed++;
        results.push({
          key,
          filename: basename(key),
          status: 'FAILED',
          error: err?.message || String(err),
        });
      }
    }

    this.logger.log(
      `Migration completed. Total: ${pdfKeys.length}, Success: ${successful}, Failed: ${failed}`,
    );

    return {
      totalPDFs: pdfKeys.length,
      processed: pdfKeys.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * List all PDF files inside R2 folder (default: migration/)
   */
  async listPDFsInFolder(prefix: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });
      const response = await this.s3Client.send(command);

      if (!response.Contents) return [];

      return response.Contents.map((item) => item.Key!)
        .filter((key) => key && key.toLowerCase().endsWith('.pdf'));
    } catch (error: any) {
      this.logger.error(`Error listing R2 bucket objects: ${error?.message || error}`);
      throw error;
    }
  }

  /**
   * Process single PDF file: Fetch from R2 -> Extract Text -> DeepSeek AI -> Save JSON to R2 & DB
   */
  async processSinglePDF(key: string): Promise<MigrationFileResult> {
    const filename = basename(key);

    // 1. Download file buffer from Cloudflare R2
    const getCommand = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    const s3Response = await this.s3Client.send(getCommand);
    const pdfBuffer = await streamToBuffer(s3Response.Body);

    // Write temp file to OS temp directory (/tmp) for pdftohtml conversion
    const tempDir = join(require('os').tmpdir(), 'resume_migration_temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const tempPdfPath = join(tempDir, `${Date.now()}_${filename}`);
    const htmlFileName = `${Date.now()}_${filename.replace(/\.pdf$/i, '.html')}`;
    const htmlFilePath = join(tempDir, htmlFileName);

    let rawText = '';
    try {
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      // 2. Extract Text using pdftohtml (with pdf-parse fallback)
      try {
        const command = `pdftohtml -s -noframes -c -dataurls "${tempPdfPath}" "${htmlFilePath}"`;
        execSync(command);

        if (fs.existsSync(htmlFilePath)) {
          rawText = fs.readFileSync(htmlFilePath, 'utf8');
        }
      } catch (execError: any) {
        this.logger.warn(
          `pdftohtml failed for ${filename}, falling back to pdf-parse: ${execError?.message || execError}`,
        );
      }

      if (!rawText || rawText.trim() === '') {
        try {
          const pdfParse = require('pdf-parse');
          const pdfData = await pdfParse(pdfBuffer);
          rawText = pdfData?.text || '';
        } catch (pdfParseErr: any) {
          this.logger.error(`pdf-parse fallback failed for ${filename}:`, pdfParseErr);
        }
      }
    } finally {
      // Guaranteed cleanup of temp PDF & HTML files
      if (fs.existsSync(tempPdfPath)) {
        try { fs.unlinkSync(tempPdfPath); } catch (e) { }
      }
      if (fs.existsSync(htmlFilePath)) {
        try { fs.unlinkSync(htmlFilePath); } catch (e) { }
      }
    }

    if (!rawText || rawText.trim() === '') {
      return {
        key,
        filename,
        status: 'FAILED',
        error: 'Unable to extract text from PDF file (PDF might be image/scanned)',
      };
    }

    // 3. Send text to DeepSeek AI API to extract Name, Email, Contact, Skills
    this.logger.log(`Sending extracted text from "${filename}" to DeepSeek AI...`);
    const parsedData = await this.deepSeekService.parseResumeSources({ htmlText: rawText });

    // 4. Save candidate record into PostgreSQL Database via Prisma
    let candidateId: string | undefined;
    try {
      const fullName = parsedData.name || filename.replace(/\.pdf$/i, '');
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Candidate';
      const uniqueEmail =
        parsedData.email || `candidate_${Date.now()}_${Math.floor(Math.random() * 1000)}@migration.temp`;

      const candidate = await this.prisma.candidate.create({
        data: {
          firstName,
          lastName,
          email: uniqueEmail,
          mobile: parsedData.contact || null,
          yearsOfExperience: 0,
          noticePeriod: 0,
          resume: key,
          resumeText: rawText,
          resumeJson: JSON.stringify(parsedData),
        },
      });
      candidateId = candidate.id;

      // Handle skills attachment if skills array is present
      if (parsedData.skills && parsedData.skills.length > 0) {
        for (const skillName of parsedData.skills) {
          const cleanSkillName = skillName.trim();
          if (!cleanSkillName) continue;

          try {
            const skill = await this.prisma.skill.upsert({
              where: { name: cleanSkillName },
              update: {},
              create: { name: cleanSkillName },
            });

            await this.prisma.candidateSkill.create({
              data: {
                candidateId: candidate.id,
                skillId: skill.id,
              },
            });
          } catch (skillErr) {
            // Ignore duplicate skill link errors
          }
        }
      }

      this.logger.log(`Created Candidate record in DB (ID: ${candidateId}) for "${firstName} ${lastName}"`);
    } catch (dbErr: any) {
      this.logger.warn(`Could not save candidate record to DB: ${dbErr?.message || dbErr}`);
    }

    return {
      key,
      filename,
      status: 'SUCCESS',
      extractedData: parsedData,
      // r2JsonPath,
      candidateId,
    };
  }
}
