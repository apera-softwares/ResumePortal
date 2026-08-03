import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';
import { CandidateModule } from 'src/candidate/candidate.module';
import { CandidateCronService } from './candidate-cron.service';

import { DeepSeekService } from 'src/utils/deepseek.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [AuthModule, CandidateModule],
  controllers: [JobsController],
  providers: [JobsService, PrismaService, CandidateCronService, DeepSeekService, ConfigService],
})
export class JobsModule {}

