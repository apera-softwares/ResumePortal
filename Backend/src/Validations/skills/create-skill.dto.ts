// dto/create-skill.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSkillDto {
  @ApiProperty({ description: 'The name of the skill', example: 'React' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
