import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSkillDto } from 'src/Validations/skills/create-skill.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  async createSkill(dto: CreateSkillDto) {
    try {
      const { name } = dto;

      // Check if skill already exists
      const existing = await this.prisma.skill.findUnique({ where: { name } });
      if (existing) {
        throw new ForbiddenException(`Skill "${name}" already exists`);
      }

      return this.prisma.skill.create({
        data: { name },
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new HttpException(
        'Skill not created',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // get all skills
  async findAll(search?: string) {
    return this.prisma.skill.findMany({
      where: search
        ? {
            name: { contains: search, mode: 'insensitive' },
          }
        : {},
      orderBy: { name: 'asc' },
    });
  }

  // get skill by id
  async getById(id: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException('Skill not found');
    return skill;
  }

  // delete skills
  async deleteSkill(id: string) {
    const existing = await this.prisma.skill.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Skill with ID ${id} not found`);
    }

    return this.prisma.skill.delete({ where: { id } });
  }
}
