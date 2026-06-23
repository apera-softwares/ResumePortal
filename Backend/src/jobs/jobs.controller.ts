import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  SetMetadata,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from 'src/Validations/job/create-job.dto';
import { UpdateJobDto } from 'src/Validations/job/update-job.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Only Admin and HR can create job
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  @Post('create')
  async createJob(@Body() dto: CreateJobDto, @Request() req) {
    const userId = req.user.user; // comes from JWT payload
    return this.jobsService.create(dto, userId);
  }

  // get all jobs
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.jobsService.findAll(pageNum, limitNum, search, location, type);
  }

  // get single job
  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(Number(id));
  }

  // only admin and hr can edit the job using id
@UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
     return this.jobsService.update(Number(id), updateJobDto);
  }

  // only admin and hr delete job
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  @Delete(':id')
  async deleteJob(@Param('id') id: string) {
    return this.jobsService.jobDeleteById(Number(id));
  }
}
