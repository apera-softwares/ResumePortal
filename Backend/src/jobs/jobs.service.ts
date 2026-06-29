import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateJobDto } from 'src/Validations/job/create-job.dto';
import { UpdateJobDto } from 'src/Validations/job/update-job.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Resolve a client name → clientId via upsert, returns undefined if no name given */
  private async resolveClientId(name?: string): Promise<string | undefined> {
    if (!name?.trim()) return undefined;
    const clientObj = await this.prisma.client.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });
    return clientObj.id;
  }

  /** Map a raw Prisma Job row (with includes) to the flat DTO the frontend expects */
  private mapJob(job: any) {
    return {
      ...job,
      client: job.client?.name ?? null,
      location: job.location?.name ?? null,
      skills: (job.skills || []).map((s: any) => s.skill?.name || s.name || ''),
      appliedCount: job._count?.appliedJobs ?? 0,
    };
  }

  /** Resolve a location name → locationId via upsert */
  private async resolveLocationId(name?: string): Promise<string | undefined> {
    if (!name?.trim()) return undefined;
    const locObj = await this.prisma.location.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });
    return locObj.id;
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(createJobDto: CreateJobDto, createdById: string) {
    try {
      const { client, skills, location, ...jobData } = createJobDto;

      const clientId = await this.resolveClientId(client);
      const locationId = await this.resolveLocationId(location);

      const job = await this.prisma.job.create({
        data: {
          ...jobData,
          createdById,
          ...(clientId ? { clientId } : {}),
          ...(locationId ? { locationId } : {}),
          ...(skills?.length
            ? {
                skills: {
                  create: skills.map((name) => ({
                    skill: {
                      connectOrCreate: {
                        where: { name },
                        create: { name },
                      },
                    },
                  })),
                },
              }
            : {}),
        },
        include: {
          client: true,
          skills: { include: { skill: true } },
          location: true,
        },
      });

      return {
        message: 'Job created successfully',
        statusCode: 201,
        data: this.mapJob(job),
      };
    } catch (error) {
      console.error('Job creation failed:', error);
      throw new HttpException('Job creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  // ── Read All ───────────────────────────────────────────────────────────────

  async findAll(
    page?: number,
    limit?: number,
    search?: string,
    location?: string,
    type?: string,
  ) {
    const where: any = {};

    if (search?.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
        { client: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    // location is now a related model — filter by name
    if (location?.trim() && location.toLowerCase() !== 'all') {
      where.location = {
        name: { equals: location.trim(), mode: 'insensitive' },
      };
    }

    if (type?.trim() && type.toLowerCase() !== 'all') {
      where.type = type.trim().toUpperCase();
    }

    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit ?? undefined;

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take,
        include: {
          client: true,
          skills: { include: { skill: true } },
          location: true,
          createdBy: { select: { id: true, name: true, role: true } },
          _count: {
            select: {
              appliedJobs: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.job.count({ where }),
    ]);

    return {
      message: 'Jobs fetched successfully',
      statusCode: 200,
      data: jobs.map((job) => this.mapJob(job)),
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    };
  }

  // ── Read One ───────────────────────────────────────────────────────────────

  async getJobById(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        skills: { include: { skill: true } },
        location: true,
        createdBy: true,
        _count: {
          select: {
            appliedJobs: true,
          },
        },
      },
    });

    if (!job) throw new HttpException('Job not found', HttpStatus.NOT_FOUND);

    return {
      message: 'Job fetched successfully',
      statusCode: 200,
      data: this.mapJob(job),
    };
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(id: string, updateJobDto: UpdateJobDto) {
    const existingJob = await this.prisma.job.findUnique({ where: { id } });
    if (!existingJob)
      throw new NotFoundException(`Job not found with id: ${id}`);

    const { client, skills, location, ...jobData } = updateJobDto;

    const clientId = await this.resolveClientId(client);
    const locationId = await this.resolveLocationId(location);

    const updatedJob = await this.prisma.job.update({
      where: { id },
      data: {
        ...jobData,
        ...(clientId !== undefined ? { clientId } : {}),
        ...(locationId !== undefined ? { locationId } : {}),
        ...(skills
          ? {
              skills: {
                deleteMany: {}, // detach all existing JobSkill records
                create: skills.map((name) => ({
                  skill: {
                    connectOrCreate: {
                      where: { name },
                      create: { name },
                    },
                  },
                })),
              },
            }
          : {}),
      },
      include: {
        client: true,
        skills: { include: { skill: true } },
        location: true,
        _count: {
          select: {
            appliedJobs: true,
          },
        },
      },
    });

    return {
      message: 'Job updated successfully',
      statusCode: 200,
      data: this.mapJob(updatedJob),
    };
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async jobDeleteById(id: string) {
    try {
      await this.prisma.job.delete({ where: { id } });
      return { message: 'Job deleted successfully', statusCode: 200 };
    } catch (error) {
      throw new HttpException('Failed to delete job', HttpStatus.BAD_REQUEST);
    }
  }
}
