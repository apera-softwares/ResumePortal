import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UsersUpdateDto {
  @ApiProperty({ description: 'The name of the user', required: false, example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'The first name of the user', required: false, example: 'John' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'The last name of the user', required: false, example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'The email address of the user', required: false, example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'The role of the user', enum: Role, required: false, example: Role.CANDIDATE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({ description: 'The new password for the user', required: false, minLength: 6, example: 'newpassword123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ description: 'The mobile number of the user', required: false, example: '1234567890' })
  @IsOptional()
  @IsString()
  mobile?: string;

  @ApiProperty({ description: 'The company name of the user (for client)', required: false, example: 'Google' })
  @IsOptional()
  @IsString()
  companyName?: string;
}
