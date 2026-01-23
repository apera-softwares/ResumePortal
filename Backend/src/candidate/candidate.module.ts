import { Module } from '@nestjs/common';
import { CandidateService } from './candidate.service';
import { CandidateController } from './candidate.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';

@Module({
  imports : [AuthModule],
  controllers: [CandidateController],
  providers: [CandidateService, PrismaService],
})
export class CandidateModule {}
