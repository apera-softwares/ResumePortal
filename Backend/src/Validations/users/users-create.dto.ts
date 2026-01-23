import { IsEmail, IsNotEmpty, IsEnum, IsString } from 'class-validator';
import { Role } from '@prisma/client';

export class UsersCreateDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsEnum(Role)
  role: Role;
}
