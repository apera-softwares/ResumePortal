import { Module, forwardRef } from '@nestjs/common';
import { OtpService } from './otp.service';
import { OtpController } from './otp.controller';
import { PrismaService } from 'src/prisma.service';
import { MailModule } from 'src/mail/mail.module';
import { AuthModule } from 'src/guards/auth.module';

@Module({
  imports: [MailModule, forwardRef(() => AuthModule)],
  controllers: [OtpController],
  providers: [OtpService, PrismaService],
  exports: [OtpService],
})
export class OtpModule {}
