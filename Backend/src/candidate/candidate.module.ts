import { Module } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';
import { DeepSeekService } from '../utils/deepseek.service';

@Module({
  imports: [AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService, PrismaService, DeepSeekService],
  exports: [CandidateService],
})
export class CandidateModule {}

