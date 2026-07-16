import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { PrismaService } from 'src/prisma.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
    imports: [MailModule],
    controllers: [OtpController],
    providers: [OtpService, PrismaService],
    exports: [OtpService],
})
export class OtpModule { }