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
}
