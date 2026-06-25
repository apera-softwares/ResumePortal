import { Injectable } from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Injectable()
export class LoginDto {
  @ApiProperty({ description: 'The email address of the user', example: 'john@example.com' })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password of the user', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
