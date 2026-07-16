import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator';
import { JobType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateJobDto {
  @ApiProperty({ description: 'The title of the job', required: false, example: 'Frontend Developer' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'The description of the job', required: false, example: 'We are looking for a skilled developer...' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'The client name', required: false, example: 'Tech Corp' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiProperty({ description: 'The required skills', required: false, example: ['React', 'TypeScript'] })
  @IsArray()
  @ArrayNotEmpty()
  skills: string[];

  @ApiProperty({ description: 'The salary for the job', required: false, example: 100000 })
  @IsOptional()
  @IsNumber()
  salary?: number;

  @ApiProperty({ description: 'The internal salary reference', required: false, example: 90000 })
  @IsOptional()
  @IsNumber()
  internalSalary?: number;

  @ApiProperty({ description: 'The location of the job', required: false, example: 'New York, NY' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'The type of the job', enum: JobType, required: false, example: JobType.FULL_TIME })
  @IsEnum(JobType)
  type: JobType;
}
