import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CandidateCreatedEvent } from 'src/envent/events';
import { PrismaService } from 'src/prisma.service';
import { join, extname, dirname, basename } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as mammoth from 'mammoth';
import { execSync } from 'child_process';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DeepSeekService } from '../utils/deepseek.service';

const client = new S3Client({
  region: 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

async function streamToBuffer(stream: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

@Injectable()
export class CandidateCreatedListener {
  constructor(
    private prisma: PrismaService,
    private deepSeekService: DeepSeekService,
  ) { }

  @OnEvent('candidate.created')
  async handleCandidateCreatedEvent(event: CandidateCreatedEvent) {
    const { candidateId } = event;
    console.log(`[Event Handler] Starting processing for candidate ID: ${candidateId}`);

    const tempDir = join(os.tmpdir(), 'resume_portal_temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    let tempFilePath: string | null = null;
    let tempHtmlPath: string | null = null;

    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate || !candidate.resume) {
        console.warn(`[Event Handler] Candidate or resume field missing for ID: ${candidateId}`);
        return;
      }

      let rawKey = candidate.resume;
      if (rawKey.includes('?')) rawKey = rawKey.split('?')[0];

      const fileNameOnly = basename(rawKey);
      const fileExtension = extname(fileNameOnly).toLowerCase();

      tempFilePath = join(tempDir, `${Date.now()}_${fileNameOnly}`);
      let fileBuffer: Buffer | null = null;

      // Fetch file buffer from R2/S3 or HTTP endpoint
      if (rawKey.startsWith('http://') || rawKey.startsWith('https://')) {
        const httpRes = await fetch(rawKey);
        if (httpRes.ok) {
          const arrayBuffer = await httpRes.arrayBuffer();
          fileBuffer = Buffer.from(arrayBuffer);
        }
      } else if (process.env.S3_BUCKET) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: rawKey,
          });
          const s3Response = await client.send(getCommand);
          fileBuffer = await streamToBuffer(s3Response.Body);
        } catch (s3Err: any) {
          console.error(`[Event Handler] Error fetching key "${rawKey}" from R2/S3:`, s3Err?.message || s3Err);
        }
      }

      if (!fileBuffer) {
        console.error(`[Event Handler] Could not retrieve file buffer for candidate ID: ${candidateId}`);
        return;
      }

      fs.writeFileSync(tempFilePath, fileBuffer);
      let resumeText = '';

      // Text extraction based on file extension
      if (fileExtension === '.pdf') {
        tempHtmlPath = join(tempDir, `${Date.now()}_${fileNameOnly.replace(/\.pdf$/i, '.html')}`);
        try {
          const command = `pdftohtml -s -noframes -c -dataurls "${tempFilePath}" "${tempHtmlPath}"`;
          execSync(command);

          if (fs.existsSync(tempHtmlPath)) {
            resumeText = fs.readFileSync(tempHtmlPath, 'utf8');
          }
        } catch (execError: any) {
          console.warn('[Event Handler] pdftohtml conversion failed, falling back to pdf-parse');
        }

        if (!resumeText || resumeText.trim() === '') {
          try {
            const pdfParse = require('pdf-parse');
            const pdfData = await pdfParse(fileBuffer);
            if (pdfData && pdfData.text && pdfData.text.trim()) {
              const lines = pdfData.text.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
              const paragraphs = lines.map((line: string) => {
                const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                if (line.length < 40 && !line.endsWith('.')) {
                  return `<h3 style="font-size: 16px; font-weight: bold; color: #1e3a8a; margin-top: 16px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">${escaped}</h3>`;
                }
                return `<p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 10px;">${escaped}</p>`;
              });
              resumeText = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff;">\n${paragraphs.join('\n')}\n</div>`;
            }
          } catch (pdfParseErr: any) {
            console.error('[Event Handler] pdf-parse fallback failed:', pdfParseErr?.message || pdfParseErr);
          }
        }
      } else if (fileExtension === '.docx' || fileExtension === '.doc') {
        try {
          tempHtmlPath = join(tempDir, `${Date.now()}_${fileNameOnly.replace(/\.(docx|doc)$/i, '.html')}`);
          const command = `libreoffice --headless --convert-to html --outdir "${tempDir}" "${tempFilePath}"`;
          execSync(command);

          if (fs.existsSync(tempHtmlPath)) {
            resumeText = fs.readFileSync(tempHtmlPath, 'utf8');
          }
        } catch (libreOfficeError) {
          try {
            const result = await mammoth.convertToHtml({ buffer: fileBuffer });
            resumeText = result.value || '';
          } catch (mammothError: any) {
            console.error('[Event Handler] Fallback Mammoth DOCX conversion failed:', mammothError?.message);
          }
        }
      }

      // DeepSeek AI Parsing
      let parsedJson: any = null;
      if (resumeText && resumeText.trim() !== '') {
        try {
          console.log(`[Event Handler] Sending extracted text to DeepSeek AI...`);
          parsedJson = await this.deepSeekService.parseResumeText(resumeText);
          console.log(`\n======================================================`);
          console.log(`[Event Handler] 📊 PARSED DEEPSEEK JSON FOR CANDIDATE ${candidateId}:`);
          console.log(JSON.stringify(parsedJson, null, 2));
          console.log(`======================================================\n`);
        } catch (aiErr: any) {
          console.error(`[Event Handler] DeepSeek AI parsing error:`, aiErr?.message || aiErr);
        }
      }

      // Update candidate database record
      await this.prisma.candidate.update({
        where: { id: candidateId },
        data: {
          resumeText,
          ...(parsedJson ? { resumeJson: JSON.stringify(parsedJson) } : {}),
        },
      });

      console.log(`[Event Handler] Successfully processed candidate ID: ${candidateId}`);
    } catch (error: any) {
      console.error(`[Event Handler] Processing error for candidate ID ${candidateId}:`, error?.message || error);
    } finally {
      // Guaranteed cleanup of temp OS files
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) { }
      }
      if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
        try { fs.unlinkSync(tempHtmlPath); } catch (e) { }
      }
    }
  }
}
