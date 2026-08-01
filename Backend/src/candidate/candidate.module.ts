import { Module } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';
import { CandidateCreatedListener } from '../listeners/candidate-created.listener';

import { DeepSeekService } from '../utils/deepseek.service';

@Module({
  imports: [AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService, PrismaService, CandidateCreatedListener, DeepSeekService],
  exports: [CandidateService],
})
export class CandidateModule {}

