import { Module } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';
import { CandidateCreatedListener } from '../listeners/candidate-created.listener';

@Module({
  imports : [AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService, PrismaService, CandidateCreatedListener],
})
export class CandidateModule {}
