import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma.service';
import { DeepSeekService, ResumeTextSources } from 'src/utils/deepseek.service';
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { join, extname, basename } from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as mammoth from 'mammoth';
import { execSync } from 'child_process';

const s3Client = new S3Client({
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
export class CandidateCronService {
    private readonly logger = new Logger(CandidateCronService.name);

    constructor(
        private prisma: PrismaService,
        private deepSeekService: DeepSeekService,
    ) { }

    @Cron(CronExpression.EVERY_MINUTE)
    async handleCron() {
        this.logger.log('Starting automated migration resume parsing cron task...');

        if (!process.env.S3_BUCKET) {
            this.logger.warn('S3_BUCKET is not set in environment variables.');
            return;
        }

        const tempDir = join(os.tmpdir(), 'cron_resume_temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const prefix = `${process.env.S3_MIGRATION_FOLDER}/`;

        try {
            const listCmd = new ListObjectsV2Command({
                Bucket: process.env.S3_BUCKET,
                Prefix: prefix,
                MaxKeys: 3,
            });
            const s3Res = await s3Client.send(listCmd);
            const objects = s3Res.Contents || [];
            console.log(objects, "objects")

            for (const obj of objects) {
                if (!obj.Key || obj.Key.endsWith('/') || obj.Key.endsWith('.keep')) continue;
                const s3Key = obj.Key;

                this.logger.log(`Processing migration file from S3: "${s3Key}"...`);

                let tempFilePath: string | null = null;
                let tempHtmlPath: string | null = null;

                try {
                    // 1. Download file buffer from S3
                    const getCommand = new GetObjectCommand({
                        Bucket: process.env.S3_BUCKET,
                        Key: s3Key,
                    });
                    const s3Response = await s3Client.send(getCommand);
                    const fileBuffer = await streamToBuffer(s3Response.Body);

                    const fileNameOnly = basename(s3Key);
                    const fileExtension = extname(fileNameOnly).toLowerCase();

                    tempFilePath = join(tempDir, `${Date.now()}_${fileNameOnly}`);
                    fs.writeFileSync(tempFilePath, fileBuffer);

                    let resumeText = ''; // primary display text (HTML)
                    const resumeSources: ResumeTextSources = {};

                    // 2. Text extraction based on file extension
                    if (fileExtension === '.pdf') {
                        // ── Source A: pdftohtml (HTML — good layout, can mangle emails) ──
                        tempHtmlPath = join(tempDir, `${Date.now()}_${fileNameOnly.replace(/\.pdf$/i, '.html')}`);
                        try {
                            const command = `pdftohtml -s -noframes -c -dataurls "${tempFilePath}" "${tempHtmlPath}"`;
                            execSync(command);
                            if (fs.existsSync(tempHtmlPath)) {
                                resumeText = fs.readFileSync(tempHtmlPath, 'utf8');
                                resumeSources.htmlText = resumeText;
                            }
                        } catch (pdfErr: any) {
                            this.logger.error(`pdftohtml failed for "${s3Key}": ${pdfErr?.message}`);
                        }

                        // ── Source B: pdf-parse (raw text stream — most accurate emails) ──
                        try {
                            const pdfParseLib = require('pdf-parse');
                            const pdfData = await pdfParseLib(fileBuffer);
                            if (pdfData?.text) {
                                resumeSources.plainText = pdfData.text.trim();
                                this.logger.log(`pdf-parse extracted ${resumeSources.plainText?.length ?? 0} chars for "${s3Key}".`);
                            }
                        } catch (ppErr: any) {
                            this.logger.warn(`pdf-parse failed for "${s3Key}": ${ppErr?.message}`);
                        }

                        // ── Source C: pdftotext CLI (fallback — different algorithm) ──
                        try {
                            const pdftotextOut = execSync(`pdftotext "${tempFilePath}" -`, { maxBuffer: 10 * 1024 * 1024 }).toString();
                            if (pdftotextOut?.trim()) {
                                resumeSources.pdfTextFallback = pdftotextOut.trim();
                                this.logger.log(`pdftotext extracted ${resumeSources.pdfTextFallback.length} chars for "${s3Key}".`);
                            }
                        } catch (ptErr: any) {
                            this.logger.warn(`pdftotext failed for "${s3Key}": ${ptErr?.message}`);
                        }

                    } else if (fileExtension === '.docx' || fileExtension === '.doc') {
                        try {
                            const res = await mammoth.convertToHtml({ path: tempFilePath });
                            resumeText = res.value ? res.value.trim() : '';
                            resumeSources.docxHtml = resumeText;
                        } catch (docErr: any) {
                            this.logger.error(`Mammoth extraction failed for "${s3Key}": ${docErr?.message}`);
                        }
                    }

                    const hasAnySource = resumeSources.htmlText || resumeSources.plainText ||
                        resumeSources.pdfTextFallback || resumeSources.docxHtml;

                    if (!hasAnySource) {
                        this.logger.warn(`No text could be extracted from "${s3Key}". Skipping AI parsing.`);
                        continue;
                    }

                    // 3. AI DeepSeek Parsing (multi-source)
                    this.logger.log(`Parsing resume sources with DeepSeek AI for "${s3Key}"...`);
                    const parsedJson = await this.deepSeekService.parseResumeSources(resumeSources);

                    const rawName = parsedJson?.name?.trim() || '';
                    let firstName = 'Migration';
                    let lastName = 'Candidate';
                    if (rawName) {
                        const nameParts = rawName.split(/\s+/);
                        firstName = nameParts[0];
                        if (nameParts.length > 1) {
                            lastName = nameParts.slice(1).join(' ');
                        } else {
                            lastName = '';
                        }
                    }


                    const extractedEmail = parsedJson?.email?.trim() || '';
                    const candidateMobile = parsedJson?.contact?.trim() || null;
                    const resumeJsonStr = JSON.stringify(parsedJson);

                    const newFileName = `${firstName}_${Date.now()}${fileExtension}`;

                    // 4. Save/Upsert Candidate in Database
                    // If no email was extracted (e.g. image-based PDF), generate a unique
                    // placeholder so we never collide on the email unique constraint.
                    const hasEmail = extractedEmail.length > 0;
                    const candidateEmail = hasEmail
                        ? extractedEmail
                        : `no-email-${Date.now()}-${Math.random().toString(36).slice(2)}@migration.local`;

                    // Only look up by email when we actually have one; otherwise always create.
                    const existingCandidate = hasEmail
                        ? await this.prisma.candidate.findFirst({ where: { email: extractedEmail } })
                        : null;

                    let candidate;
                    if (!existingCandidate) {
                        candidate = await this.prisma.candidate.create({
                            data: {
                                firstName,
                                lastName,
                                email: candidateEmail,
                                mobile: candidateMobile,
                                yearsOfExperience: 0,
                                noticePeriod: 0,
                                resume: `${process.env.S3_RESUME_FOLDER}/${newFileName}`,
                                resumeText,
                                resumeJson: resumeJsonStr,
                            },
                        });
                        this.logger.log(`Created new candidate ID "${candidate.id}" for "${firstName} ${lastName}" (Email: ${candidateEmail}).`);
                    } else {
                        candidate = await this.prisma.candidate.update({
                            where: { id: existingCandidate.id },
                            data: {
                                firstName,
                                lastName,
                                resume: `${process.env.S3_RESUME_FOLDER}/${newFileName}`,
                                mobile: candidateMobile || existingCandidate.mobile,
                                resumeText,
                                resumeJson: resumeJsonStr,
                            },
                        });
                        this.logger.log(`Updated existing candidate ID "${candidate.id}" for "${firstName} ${lastName}" (Email: ${candidateEmail}).`);
                    }

                    // 5. Connect extracted skills
                    if (parsedJson?.skills && Array.isArray(parsedJson.skills) && parsedJson.skills.length > 0) {
                        for (const skillName of parsedJson.skills) {
                            const cleanSkill = skillName.trim();
                            if (!cleanSkill) continue;
                            try {
                                const skillRecord = await this.prisma.skill.upsert({
                                    where: { name: cleanSkill },
                                    update: {},
                                    create: { name: cleanSkill },
                                });

                                await this.prisma.candidateSkill.upsert({
                                    where: {
                                        candidateId_skillId: {
                                            candidateId: candidate.id,
                                            skillId: skillRecord.id,
                                        },
                                    },
                                    update: {},
                                    create: {
                                        candidateId: candidate.id,
                                        skillId: skillRecord.id,
                                    },
                                });
                            } catch (skillErr) { }
                        }
                    }

                    this.logger.log(`Successfully parsed candidate "${firstName} ${lastName}" (Email: ${candidateEmail}) from S3 key: "${s3Key}"`);


                    console.log("Copying to resume folder");
                    const destinationKey = `${process.env.S3_RESUME_FOLDER}/${newFileName}`;
                    console.log(destinationKey, "destinationKey")


                    const bucketName = process.env.S3_BUCKET;

                    const copyCommand = new CopyObjectCommand({
                        Bucket: process.env.S3_BUCKET,
                        CopySource: `${bucketName}/${s3Key}`,
                        Key: destinationKey,
                    });
                    await s3Client.send(copyCommand);
                    console.log("Successfully copied to resumes folder");

                    // 6. Delete processed file from S3 bucket
                    this.logger.log(`Deleting processed PDF file from S3: "${s3Key}"...`);
                    const deleteCommand = new DeleteObjectCommand({
                        Bucket: process.env.S3_BUCKET,
                        Key: s3Key,
                    });
                    await s3Client.send(deleteCommand);
                    this.logger.log(`Successfully deleted "${s3Key}" from S3 bucket after parsing.`);

                } catch (fileErr: any) {
                    this.logger.error(`Error processing S3 file "${s3Key}": ${fileErr?.message || fileErr}`);
                } finally {
                    if (tempFilePath && fs.existsSync(tempFilePath)) {
                        try { fs.unlinkSync(tempFilePath); } catch (e) { }
                    }
                    if (tempHtmlPath && fs.existsSync(tempHtmlPath)) {
                        try { fs.unlinkSync(tempHtmlPath); } catch (e) { }
                    }
                    this.logger.log(`Completed single file processing for "${s3Key}". Exiting cron run.`);
                    return;
                }
            }
        } catch (prefixErr: any) {
            this.logger.error(`Error scanning prefix "${prefix}": ${prefixErr?.message || prefixErr}`);
        }

    }
}