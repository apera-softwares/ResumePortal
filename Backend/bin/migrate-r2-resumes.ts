import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MigrationService } from '../src/jobs/migration.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('MigrationCLI');
  logger.log('Starting Cloudflare R2 Resume Migration CLI...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const migrationService = app.get(MigrationService);

  const folderArg = process.argv[2] || 'migration/';
  logger.log(`Target R2 Bucket Folder: "${folderArg}"`);

  try {
    const summary = await migrationService.processR2Migration(folderArg);
    console.log('\n==============================================');
    console.log('       R2 DEEPSEEK MIGRATION SUMMARY          ');
    console.log('==============================================');
    console.log(`Total PDFs Found : ${summary.totalPDFs}`);
    console.log(`Successfully Parsed: ${summary.successful}`);
    console.log(`Failed           : ${summary.failed}`);
    console.log('----------------------------------------------');
    summary.results.forEach((res, i) => {
      console.log(
        `[${i + 1}] ${res.filename} => Status: ${res.status}${
          res.extractedData?.name ? ` | Name: ${res.extractedData.name}` : ''
        }${res.extractedData?.email ? ` | Email: ${res.extractedData.email}` : ''}${
          res.error ? ` | Error: ${res.error}` : ''
        }`,
      );
    });
    console.log('==============================================\n');
  } catch (err: any) {
    logger.error('Migration CLI failed:', err?.message || err);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
