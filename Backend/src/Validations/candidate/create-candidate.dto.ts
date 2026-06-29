// src/candidate/dto/create-candidate.dto.ts
import {
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CandidateDto {
  @ApiProperty({ description: 'The first name of the candidate', example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'The last name of the candidate', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'The email of the candidate', example: 'jane.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The mobile number of the candidate', required: false, example: '1234567890' })
  @IsOptional()
  @IsString()
  mobile: string;

  @ApiProperty({ description: 'Years of experience', example: 5 })
  @IsNotEmpty()
  // @IsInt()
  yearsOfExperience: number;

  @ApiProperty({ description: 'Education details', required: false, example: 'B.Sc. Computer Science' })
  @IsOptional()
  @IsString()
  education: string;

  @ApiProperty({ description: 'Notice period in days', example: 30 })
  @IsNotEmpty()
  noticePeriod: number;

  @ApiProperty({ description: 'Skills of the candidate (comma-separated or array)', required: false, example: 'React, Node.js' })
  @IsOptional()
  skills: string | string[];

  @ApiProperty({ description: 'Current location of the candidate', required: false, example: 'Delhi' })
  @IsOptional()
  @IsString()
  currentLocation?: string;

  @ApiProperty({ description: 'Preferred work mode (Remote / Hybrid / On-site)', required: false, example: 'Remote' })
  @IsOptional()
  @IsString()
  preferredWorkMode?: string;

  @ApiProperty({ description: 'Preferred job locations (comma-separated or array)', required: false, example: 'Bangalore, Pune' })
  @IsOptional()
  preferredJobLocations?: string | string[];

  @ApiProperty({ description: 'Expected CTC', required: false, example: 12.5 })
  @IsOptional()
  expectedCtc?: number | string;

  @ApiProperty({ description: 'Current CTC', required: false, example: 10.0 })
  @IsOptional()
  currentCtc?: number | string;

  @ApiProperty({ description: 'The ID of the job the candidate is applying for', required: false, example: 'uuid-123' })
  @IsOptional()
  jobId?: string | number;

  @ApiProperty({ description: 'The ID of the user submitting the candidate', required: false, example: 'uuid-456' })
  @IsOptional()
  @IsString()
  userId?: string;
}
