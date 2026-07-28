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
  async findAll(page?: number, limit?: number, search?: string) {
    const pageNum = page && !isNaN(page) && page > 0 ? Math.floor(page) : undefined;
    const limitNum = limit && !isNaN(limit) && limit > 0 ? Math.floor(limit) : undefined;

    const where: any = {};
    if (search && search.trim() !== '') {
      where.name = { contains: search.trim(), mode: 'insensitive' };
    }

    // If caller did not request pagination (legacy direct list call)
    if (!pageNum && !limitNum) {
      return this.prisma.skill.findMany({
        where,
        orderBy: { name: 'asc' },
      });
    }

    const actualPage = pageNum || 1;
    const skip = limitNum ? (actualPage - 1) * limitNum : undefined;
    const take = limitNum;

    const [skills, total] = await Promise.all([
      this.prisma.skill.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.skill.count({ where }),
    ]);

    const totalPages = limitNum ? Math.ceil(total / limitNum) || 1 : 1;
    const isPageOutOfBounds = limitNum && total > 0 && actualPage > totalPages;

    let message = 'Skills fetched successfully';
    if (total === 0) {
      message = 'No skills found';
    } else if (isPageOutOfBounds) {
      message = `Requested page ${actualPage} exceeds total available pages (${totalPages})`;
    } else if (skills.length === 0) {
      message = 'No skills found for this page';
    }

    return {
      statusCode: 200,
      message,
      data: isPageOutOfBounds ? [] : skills,
      total,
      page: actualPage,
      limit: limitNum || total,
      totalPages,
    };
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
