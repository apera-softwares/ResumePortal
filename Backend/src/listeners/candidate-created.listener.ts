import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CandidateCreatedEvent } from 'src/envent/events';
import { PrismaService } from 'src/prisma.service';
import { join, extname } from 'path';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import { execSync } from 'child_process';

@Injectable()
export class CandidateCreatedListener {
  constructor(private prisma: PrismaService) {}

  @OnEvent('candidate.created')
  async handleCandidateCreatedEvent(event: CandidateCreatedEvent) {
    const { candidateId } = event;
    console.log(`[Event Handler] Starting text extraction for candidate ID: ${candidateId}`);

    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate || !candidate.resume) {
        console.warn(`[Event Handler] Candidate or resume file not found for ID: ${candidateId}`);
        return;
      }

      const uniqueFileName = candidate.resume;
      const fileExtension = extname(uniqueFileName).toLowerCase();
      const filePath = join(process.cwd(), 'uploads', uniqueFileName);

      let resumeText = '';

      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);

        if (fileExtension === '.pdf') {
          const outputDir = join(process.cwd(), 'uploads');
          const htmlFileName = uniqueFileName.replace(/\.pdf$/i, '.html');
          const htmlFilePath = join(outputDir, htmlFileName);

          try {
            const command = `pdf2htmlEX --dest-dir "${outputDir}" "${filePath}"`;
            execSync(command);

            if (fs.existsSync(htmlFilePath)) {
              resumeText = fs.readFileSync(htmlFilePath, 'utf8');
              fs.unlinkSync(htmlFilePath);
            }
          } catch (execError) {
            console.warn('[Event Handler] pdf2htmlEX failed, falling back to PDFParse:', execError.message);
            // Fallback to PDFParse
            try {
              const parser = new PDFParse({ data: buffer });
              const result = await parser.getText();
              resumeText = result.text || '';
              await parser.destroy();
            } catch (pdfParseError) {
              console.error('[Event Handler] Fallback PDFParse also failed:', pdfParseError);
            }
          }
        } else if (fileExtension === '.docx') {
          try {
            const result = await mammoth.convertToHtml({ buffer });
            resumeText = result.value || '';
          } catch (mammothError) {
            console.error('[Event Handler] Mammoth DOCX conversion failed:', mammothError);
          }
        }

        // Save the extracted text back to the database
        await this.prisma.candidate.update({
          where: { id: candidateId },
          data: { resumeText },
        });

        console.log(`[Event Handler] Text extraction completed successfully for candidate ID: ${candidateId}`);
      } else {
        console.error(`[Event Handler] Resume file does not exist on disk: ${filePath}`);
      }
    } catch (error) {
      console.error(`[Event Handler] Error during candidate event handling:`, error);
    }
  }
}