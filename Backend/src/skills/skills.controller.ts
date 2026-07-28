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
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of all skills' })
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return await this.skillsService.findAll(pageNum, limitNum, search);
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
