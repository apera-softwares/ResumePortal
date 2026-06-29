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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CandidateService } from 'src/candidate/candidate.service';
import { CreateJobDto } from 'src/Validations/job/create-job.dto';
import { UpdateJobDto } from 'src/Validations/job/update-job.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly candidateService: CandidateService,
  ) {}

  @Post('create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job (Admin/HR only)' })
  @ApiResponse({ status: 201, description: 'Job created successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  async createJob(@Body() dto: CreateJobDto, @Request() req) {
    const userId = req.user.user;
    return this.jobsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all jobs with filtering and pagination' })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of jobs' })
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

  @Get(':id')
  @ApiOperation({ summary: 'Get a single job by ID' })
  @ApiResponse({ status: 200, description: 'Job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a job by ID (Admin/HR only)' })
  @ApiResponse({ status: 200, description: 'Job updated successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a job by ID (Admin/HR only)' })
  @ApiResponse({ status: 200, description: 'Job deleted successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  async deleteJob(@Param('id') id: string) {
    return this.jobsService.jobDeleteById(id);
  }

  // ── Candidate applies to a job using their JWT session ──────────────────────
  @Post('apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to a job (Candidate only — uses JWT email)' })
  @ApiBody({ schema: { type: 'object', properties: { jobId: { type: 'string' } }, required: ['jobId'] } })
  @ApiResponse({ status: 201, description: 'Applied successfully' })
  @ApiResponse({ status: 404, description: 'No candidate profile found' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.CANDIDATE])
  @UseGuards(RoleGuard)
  async applyToJob(@Body('jobId') jobId: string, @Request() req) {
    const email: string = req.user?.email;
    return this.candidateService.applyToJobByEmail(email, jobId);
  }

  // ── Get all applied jobs for the logged-in candidate ────────────────────────
  @Get('my-applied-jobs')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all applied jobs for logged-in candidate' })
  @ApiResponse({ status: 200, description: 'List of applied jobs' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.CANDIDATE])
  @UseGuards(RoleGuard)
  async getMyAppliedJobs(@Request() req) {
    const email: string = req.user?.email;
    return this.candidateService.findByEmail(email);
  }
}
