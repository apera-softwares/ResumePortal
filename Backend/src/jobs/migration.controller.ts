import { Controller, Post, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MigrationService } from './migration.service';

@ApiTags('migration')
@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('process-r2')
  @ApiOperation({ summary: 'Trigger migration parsing for all PDFs in Cloudflare R2 migration folder using DeepSeek AI' })
  async triggerR2Migration(@Query('folder') folder?: string) {
    const folderPrefix = folder || 'migrations/';
    return await this.migrationService.processR2Migration(folderPrefix);
  }

  @Get('list-r2')
  @ApiOperation({ summary: 'List all PDF files currently waiting in R2 migration folder' })
  async listR2PDFs(@Query('folder') folder?: string) {
    const folderPrefix = folder || 'migrations/';
    const files = await this.migrationService.listPDFsInFolder(folderPrefix);
    return {
      folder: folderPrefix,
      totalCount: files.length,
      files,
    };
  }
}
