import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  SetMetadata,
  Put,
  Req,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { CreateSkillDto } from 'src/Validations/skills/create-skill.dto';

import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Role } from '@prisma/client';
import { UseGuards } from '@nestjs/common';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Post('create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new skill (Admin only)' })
  @ApiResponse({ status: 201, description: 'Skill created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admins only' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  async createSkill(@Body() dto: CreateSkillDto, @Req() req: any) {
    const userRole = req.user.role;

    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create skills');
    }

    return this.skillsService.createSkill({ ...dto });
  }

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ status: 200, description: 'List of all skills' })
  async getAll() {
    return await this.skillsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a skill by ID' })
  @ApiResponse({ status: 200, description: 'Skill details' })
  async getByID(@Param('id') id: string) {
    return await this.skillsService.getById(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a skill by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Skill deleted successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  async delete(@Param('id') id: string) {
    return await this.skillsService.deleteSkill(id);
  }
}
