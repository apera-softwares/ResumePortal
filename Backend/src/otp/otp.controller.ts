import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OtpService } from './otp.service';
import { SendOtpDto, VerifyOtpDto } from 'src/Validations/otp/otp.dto';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send an OTP code to the provided email address' })
  @ApiResponse({ status: 201, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Email delivery failed or SMTP misconfiguration' })
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.otpService.sendOtp(sendOtpDto.email);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify the OTP code sent to the email address' })
  @ApiResponse({ status: 201, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.otpService.verifyOtp(verifyOtpDto.email, verifyOtpDto.otp);
  }
}
