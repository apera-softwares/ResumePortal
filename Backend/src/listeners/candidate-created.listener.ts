import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CandidateCreatedEvent } from 'src/envent/events';
import { PrismaService } from 'src/prisma.service';
import { join, extname } from 'path';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { execSync } from 'child_process';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENPOINT,
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
  constructor(private prisma: PrismaService) {}

  @OnEvent('candidate.created')
  async handleCandidateCreatedEvent(event: CandidateCreatedEvent) {
    const { candidateId } = event;
    console.log(
      `[Event Handler] Starting text extraction for candidate ID: ${candidateId}`,
    );

    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate || !candidate.resume) {
        console.warn(
          `[Event Handler] Candidate or resume file not found for ID: ${candidateId}`,
        );
        return;
      }

      const uniqueFileName = candidate.resume;
      const fileExtension = extname(uniqueFileName).toLowerCase();
      const filePath = join(process.cwd(), 'uploads', uniqueFileName);

      let tempFileCreated = false;
      if (!fs.existsSync(filePath)) {
        console.log(`[Event Handler] File not found locally, attempting to fetch from R2/S3: ${uniqueFileName}`);
        try {
          const getCommand = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: uniqueFileName,
          });
          const s3Response = await client.send(getCommand);
          const responseBuffer = await streamToBuffer(s3Response.Body);
          
          // Ensure directory exists
          const dir = join(process.cwd(), 'uploads');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(filePath, responseBuffer);
          tempFileCreated = true;
          console.log(`[Event Handler] Successfully downloaded file from R2/S3 to temp local path: ${filePath}`);
        } catch (s3Error) {
          console.error(`[Event Handler] Failed to fetch file from R2/S3:`, s3Error);
        }
      }

      let resumeText = '';

      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);

        if (fileExtension === '.pdf') {
          const outputDir = join(process.cwd(), 'uploads');
          const htmlFileName = uniqueFileName.replace(/\.pdf$/i, '.html');
          const htmlFilePath = join(outputDir, htmlFileName);

          try {
            // Convert to HTML using pdftohtml to preserve exact styles, positions, and fonts
            const command = `pdftohtml -s -noframes -c -dataurls "${filePath}" "${htmlFilePath}"`;
            execSync(command);

            if (fs.existsSync(htmlFilePath)) {
              resumeText = fs.readFileSync(htmlFilePath, 'utf8');
              fs.unlinkSync(htmlFilePath);
              console.log(
                `[Event Handler] pdftohtml conversion succeeded for candidate ID: ${candidateId}`,
              );
            }
          } catch (execError) {
            console.error(
              '[Event Handler] pdftohtml conversion failed:',
              execError.message,
            );
          }
        } else if (fileExtension === '.docx' || fileExtension === '.doc') {
          const outputDir = join(process.cwd(), 'uploads');
          const htmlFileName = uniqueFileName.replace(
            /\.(docx|doc)$/i,
            '.html',
          );
          const htmlFilePath = join(outputDir, htmlFileName);

          try {
            // Convert to HTML using headless LibreOffice to preserve exact layout and styles of Word files
            const command = `libreoffice --headless --convert-to html --outdir "${outputDir}" "${filePath}"`;
            execSync(command);

            if (fs.existsSync(htmlFilePath)) {
              resumeText = fs.readFileSync(htmlFilePath, 'utf8');
              fs.unlinkSync(htmlFilePath);
              console.log(
                `[Event Handler] LibreOffice Word-to-HTML conversion succeeded for candidate ID: ${candidateId}`,
              );
            }
          } catch (libreOfficeError) {
            console.warn(
              '[Event Handler] LibreOffice conversion failed, falling back to Mammoth:',
              libreOfficeError.message,
            );
            try {
              const result = await mammoth.convertToHtml({ buffer });
              resumeText = result.value || '';
            } catch (mammothError) {
              console.error(
                '[Event Handler] Fallback Mammoth DOCX conversion failed:',
                mammothError,
              );
            }
          }
        }

        // Save the extracted text back to the database
        await this.prisma.candidate.update({
          where: { id: candidateId },
          data: { resumeText },
        });

        console.log(
          `[Event Handler] Text extraction completed successfully for candidate ID: ${candidateId}`,
        );

        // Clean up temporary local file if it was created from R2/S3
        if (tempFileCreated && fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`[Event Handler] Cleaned up temporary local file: ${filePath}`);
          } catch (err) {
            console.error(`[Event Handler] Error cleaning up temporary file:`, err);
          }
        }
      } else {
        console.error(
          `[Event Handler] Resume file does not exist on disk: ${filePath}`,
        );
      }
    } catch (error) {
      console.error(
        `[Event Handler] Error during candidate event handling:`,
        error,
      );
    }
  }
}
