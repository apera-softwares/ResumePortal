import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { CandidateModule } from './candidate/candidate.module';
import { SkillsModule } from './skills/skills.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { OtpModule } from './otp/otp.module';
import { LocationsModule } from './locations/locations.module';

import { MailModule } from './mail/mail.module';
import { MigrationModule } from './jobs/migration.module';
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
    ScheduleModule.forRoot(),
    OtpModule,
    MailModule,
    LocationsModule,
    MigrationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
