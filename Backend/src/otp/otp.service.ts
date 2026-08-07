import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';
import { randomInt } from 'crypto';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private jwtService: JwtService,
  ) { }

  async sendOtp(email: string) {
    const otp = randomInt(100000, 999999).toString();

    // delete old otp
    await this.prisma.otpVerification.deleteMany({
      where: { email },
    });

    await this.prisma.otpVerification.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await this.mailService.sendOtp(email, otp);

    return {
      message: 'OTP sent successfully',
    };
  }

  async verifyOtp(email: string, otp: string) {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        otp,
      },
    });

    if (!record) {
      throw new BadRequestException('Invalid OTP');
    }

    if (record.expiresAt < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = this.jwtService.sign(
        { user: user.id, role: user.role, email: user.email },
        { secret: process.env.JWT_SECRET },
      );

      return {
        message: 'OTP verified successfully',
        data: {
          id: user.id,
          token,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }

    return {
      message: 'OTP verified successfully',
    };
  }
}
