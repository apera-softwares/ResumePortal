import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator';
import { Location, JobType } from '@prisma/client';

export class UpdateJobDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  client?: string;

  @IsArray()
  @ArrayNotEmpty()
  skills: string[];

  @IsNumber()
  salary: number;

  @IsOptional()
  @IsNumber()
  internalSalary?: number;

  @IsEnum(Location)
  location: Location;

  @IsEnum(JobType)
  type: JobType;
}
