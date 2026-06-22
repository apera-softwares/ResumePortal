import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private bucketName: string = '';
  private useS3 = false;

  constructor() {
    this.useS3 = process.env.USE_S3 === 'true';
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    
    if (this.useS3) {
      const region = process.env.AWS_REGION || 'us-east-1';
      const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

      if (!accessKeyId || !secretAccessKey || !this.bucketName) {
        this.logger.warn(
          'S3 is enabled, but AWS credentials or bucket name are missing. Falling back to local storage.'
        );
        this.useS3 = false;
      } else {
        try {
          this.s3Client = new S3Client({
            region,
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          });
          this.logger.log(`AWS S3 Storage initialized successfully in bucket: ${this.bucketName}`);
        } catch (err) {
          this.logger.error('Failed to initialize AWS S3 client. Falling back to local storage.', err);
          this.useS3 = false;
        }
      }
    }

    if (!this.useS3) {
      this.logger.log('Local Storage initialized (saving files to ./uploads)');
    }
  }

  /**
   * Save file buffer either to AWS S3 or Local Uploads folder.
   * Returns the final URL or path of the saved file.
   */
  async saveFile(filename: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (this.useS3 && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: filename,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        const region = process.env.AWS_REGION || 'us-east-1';
        return `https://${this.bucketName}.s3.${region}.amazonaws.com/${filename}`;
      } catch (err) {
        this.logger.error(`S3 upload failed for ${filename}, falling back to local file system`, err);
      }
    }

    // Local Disk Fallback
    const uploadDir = join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const localFilePath = join(uploadDir, filename);
    fs.writeFileSync(localFilePath, buffer);
    return filename; // Return filename relative to uploads directory for internal compatibility
  }

  /**
   * Delete file either from AWS S3 or Local Uploads folder.
   */
  async deleteFile(filename: string): Promise<void> {
    if (!filename) return;

    // Check if it is a full S3 url or a local filename
    const isS3Url = filename.startsWith('http://') || filename.startsWith('https://');

    if (isS3Url && this.useS3 && this.s3Client) {
      try {
        // Extract key from S3 URL
        const urlParts = filename.split('/');
        const key = urlParts[urlParts.length - 1];
        // Note: DeleteObjectCommand can be added if needed, logging for now
        this.logger.log(`Request to delete S3 file: ${key}`);
      } catch (err) {
        this.logger.error(`Failed to delete S3 file: ${filename}`, err);
      }
      return;
    }

    // Local file delete
    const localPath = join(process.cwd(), 'uploads', filename);
    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        this.logger.log(`Deleted local file: ${filename}`);
      }
    } catch (err) {
      this.logger.error(`Failed to delete local file: ${localPath}`, err);
    }
  }
}
