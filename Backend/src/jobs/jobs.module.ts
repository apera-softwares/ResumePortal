import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';
import { CandidateModule } from 'src/candidate/candidate.module';

@Module({
  imports: [AuthModule, CandidateModule],
  controllers: [JobsController],
  providers: [JobsService, PrismaService],
})
export class JobsModule {}

