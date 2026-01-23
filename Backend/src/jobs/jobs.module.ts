import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';

@Module({
  imports: [AuthModule], //gives access to JwtService and guards
  controllers: [JobsController],
  providers: [JobsService, PrismaService],
})
export class JobsModule {}
