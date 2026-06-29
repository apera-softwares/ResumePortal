import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations (cities) with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: String, description: 'Page number (1-based)' })
  @ApiQuery({ name: 'limit', required: false, type: String, description: 'Number of items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for city name' })
  @ApiResponse({ status: 200, description: 'Paginated list of locations' })
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.locationsService.findAll(pageNum, limitNum, search);
  }
}
