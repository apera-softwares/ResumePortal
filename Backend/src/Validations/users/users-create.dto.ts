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
  @ApiProperty({ description: 'The name of the user', example: 'John Doe' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The email address of the user', example: 'john@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password for the user', example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiProperty({ description: 'The role of the user', enum: Role, required: false, example: Role.CANDIDATE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
