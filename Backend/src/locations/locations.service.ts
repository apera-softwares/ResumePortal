import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page?: number, limit?: number, search?: string) {
    const where: any = {};

    if (search && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const take = limit ? limit : undefined;
    const skip = page && limit ? (page - 1) * limit : undefined;

    const [locations, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        take,
        skip,
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      data: locations,
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1,
    };
  }

  async findOne(id: string) {
    return this.prisma.location.findUnique({
      where: { id },
    });
  }
}
