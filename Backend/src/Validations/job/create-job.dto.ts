import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ArrayNotEmpty,
  IsNotEmpty,
} from 'class-validator';
import { JobType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({ description: 'The title of the job', example: 'Frontend Developer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'The description of the job', example: 'We are looking for a skilled developer...' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ description: 'The client name', required: false, example: 'Tech Corp' })
  @IsOptional()
  @IsString()
  client?: string;

  @ApiProperty({ description: 'The required skills', example: ['React', 'TypeScript', 'Tailwind'] })
  @IsArray()
  @ArrayNotEmpty()
  skills: string[];

  @ApiProperty({ description: 'The salary for the job', example: 100000 })
  @IsNotEmpty()
  @IsNumber()
  salary: number;

  @ApiProperty({ description: 'The internal salary reference', required: false, example: 90000 })
  @IsOptional()
  @IsNumber()
  internalSalary?: number;

  @ApiProperty({ description: 'The location of the job', example: 'New York, NY' })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({ description: 'The type of the job', enum: JobType, example: JobType.FULL_TIME })
  @IsEnum(JobType)
  type: JobType;
}
