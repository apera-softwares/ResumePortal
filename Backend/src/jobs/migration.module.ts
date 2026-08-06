import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma.service';
import { DeepSeekService } from 'src/utils/deepseek.service';
import { MigrationService } from './migration.service';
import { MigrationController } from './migration.controller';

@Module({
  imports: [ConfigModule],
  controllers: [MigrationController],
  providers: [MigrationService, DeepSeekService, PrismaService],
  exports: [MigrationService, DeepSeekService],
})
export class MigrationModule { }
