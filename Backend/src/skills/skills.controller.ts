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
import { SkillsService } from './skills.service';
import { CreateSkillDto } from 'src/Validations/skills/create-skill.dto';

import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { Role } from '@prisma/client';
import { UseGuards } from '@nestjs/common';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // create skills
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  @Post('create')
  async createSkill(@Body() dto: CreateSkillDto, @Req() req: any) {
    const userRole = req.user.role;

    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can create skills');
    }

    return this.skillsService.createSkill({ ...dto });
  }

  // findAll
  @Get()
  async getAll() {
    return await this.skillsService.findAll();
  }

  // get skill by id
  @Get(':id')
  async getByID(@Param('id', ParseIntPipe) id: number) {
    return await this.skillsService.getById(id);
  }

  // delete skill by id
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return await this.skillsService.deleteSkill(id);
  }
}
