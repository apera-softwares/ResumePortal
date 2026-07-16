import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'The email address to send the OTP to',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'The email address associated with the OTP',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'The 6-digit OTP code',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  otp: string;
}
