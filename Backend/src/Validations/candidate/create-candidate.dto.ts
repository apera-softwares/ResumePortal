// src/candidate/dto/create-candidate.dto.ts
import { IsNotEmpty, IsEmail, IsOptional, IsString, IsInt, IsArray, IsIn } from 'class-validator';

export class CandidateDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  mobile: string;

  @IsNotEmpty()
  // @IsInt()
  yearsOfExperience: number;

  @IsOptional()
  @IsString()
  education: string;

  @IsNotEmpty()
  noticePeriod: number;

  @IsOptional()
  skills: string | string[];

  @IsOptional()
  jobId?: string | number;
}
