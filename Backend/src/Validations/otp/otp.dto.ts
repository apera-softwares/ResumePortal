import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength, MaxLength, Matches } from 'class-validator';

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

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The email address associated with the account',
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

  @ApiProperty({
    description: 'The new password to set for the user account (12-16 chars, letters, numbers, symbols)',
    example: 'P@ssword12345!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(12)
  @MaxLength(16)
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{12,16}$/, {
    message: 'Password must be 12 to 16 characters long and contain a mix of letters, numbers, and symbols.',
  })
  newPassword: string;
}
