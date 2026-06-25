import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { CandidateModule } from './candidate/candidate.module';
import { SkillsModule } from './skills/skills.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { OtpController } from './otp/otp.controller';
import { OtpService } from './otp/otp.service';
import { OtpModule } from './otp/otp.module';

import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    JobsModule,
    CandidateModule,
    SkillsModule,
    EventEmitterModule.forRoot(),
    OtpModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
