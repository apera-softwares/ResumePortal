import { Module } from '@nestjs/common';
import { SkillsService } from './skills.service';
import { SkillsController } from './skills.controller';
import { PrismaService } from 'src/prisma.service';
import { AuthModule } from 'src/guards/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SkillsController],
  providers: [SkillsService, PrismaService],
})
export class SkillsModule {}

