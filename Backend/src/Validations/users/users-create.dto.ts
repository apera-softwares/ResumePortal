import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsString,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UsersCreateDto {
  @ApiProperty({ description: 'The name of the user', required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'The first name of the user', example: 'John' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'The last name of the user', example: 'Doe' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'The email address of the user', example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password for the user', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'The mobile number of the user', required: false, example: '1234567890' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: 'The company name of the user (for client)', required: false, example: 'Google' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: 'The role of the user', enum: Role, required: false, example: Role.CANDIDATE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
