import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const TOP_CITIES = [
  'Remote',
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'Delhi NCR',
  'Gurgaon',
  'Noida',
  'Pune',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Chandigarh',
  'Kochi',
  'Trivandrum',
  'Indore',
  'Surat',
  'Vadodara',
  'Coimbatore',
  'Visakhapatnam',
  'Lucknow',
  'Nagpur',
  'Bhopal',
  'Patna',
  'Bhubaneswar',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Rajkot',
  'Varanasi',
  'Dehradun',
];

@Injectable()
export class LocationsService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultLocations();
  }

  /** Auto-seed top 30+ tech cities if missing in database */
  async seedDefaultLocations() {
    try {
      const existing = await this.prisma.location.findMany({ select: { name: true } });
      const existingNames = new Set(existing.map((l) => l.name.toLowerCase()));

      const missing = TOP_CITIES.filter((name) => !existingNames.has(name.toLowerCase()));
      if (missing.length > 0) {
        await this.prisma.location.createMany({
          data: missing.map((name) => ({ name })),
          skipDuplicates: true,
        });
        console.log(`[LocationsService] Auto-seeded ${missing.length} top tech cities.`);
      }
    } catch (error) {
      console.error('[LocationsService] Error seeding default locations:', error);
    }
  }

  async findAll(page?: number, limit?: number, search?: string) {
    // Validate & sanitize pagination inputs
    const pageNum = page && !isNaN(page) && page > 0 ? Math.floor(page) : 1;
    const limitNum = limit && !isNaN(limit) && limit > 0 ? Math.floor(limit) : undefined;

    const where: any = {};
    if (search && search.trim() !== '') {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    const take = limitNum;
    const skip = limitNum ? (pageNum - 1) * limitNum : undefined;

    let [locations, total] = await Promise.all([
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

    // Fallback: If DB total is 0, attempt auto-seeding on-demand and retry
    if (total === 0 && (!search || search.trim() === '')) {
      await this.seedDefaultLocations();
      [locations, total] = await Promise.all([
        this.prisma.location.findMany({
          where,
          take,
          skip,
          orderBy: { name: 'asc' },
        }),
        this.prisma.location.count({ where }),
      ]);
    }

    const totalPages = limitNum ? Math.ceil(total / limitNum) || 1 : 1;
    const isPageOutOfBounds = limitNum && total > 0 && pageNum > totalPages;

    let message = 'Locations fetched successfully';
    if (total === 0) {
      message = 'No locations found';
    } else if (isPageOutOfBounds) {
      message = `Requested page ${pageNum} exceeds total available pages (${totalPages})`;
    } else if (locations.length === 0) {
      message = 'No locations found for this page';
    }

    return {
      statusCode: 200,
      message,
      data: isPageOutOfBounds ? [] : locations,
      total,
      page: pageNum,
      limit: limitNum || total,
      totalPages,
    };
  }

  async findOne(id: string) {
    return this.prisma.location.findUnique({
      where: { id },
    });
  }
}
