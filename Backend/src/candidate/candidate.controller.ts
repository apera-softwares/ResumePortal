import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  Get,
  UploadedFile,
  Param,
  Put,
  Delete,
  Query,
  Res,
  BadRequestException,
  UseGuards,
  SetMetadata,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';

import type { Express } from 'express';
import { CandidateDto } from 'src/Validations/candidate/create-candidate.dto';
import { Role } from '@prisma/client';
import { AuthGuard } from 'src/guards/auth.guard';
import { RoleGuard } from 'src/guards/role.guard';
import { $Enums } from '@prisma/client';

type CandidateStatus = $Enums.CandidateStatus;


@ApiTags('Candidates')
@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) { }

  // ── Upload resume only ────────────────────────────
  @Post('uploadresumeOnly')
  @ApiOperation({ summary: 'Upload a resume only for background processing' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Resume PDF or Document' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Only Resume uploaded successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadResumeOnly(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Resume file is required');
    return this.candidateService.uploadResumeOnly(file);
  }

  // ── Upload resume (create candidate) ───────────────────────────────────────
  @Post('uploadMedia')
  @ApiOperation({ summary: 'Upload a resume and create a candidate' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Resume PDF or Document' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        mobile: { type: 'string' },
        yearsOfExperience: { type: 'number' },
        education: { type: 'string' },
        noticePeriod: { type: 'number' },
        skills: { type: 'string' },
        jobId: { type: 'string' },
        userId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Candidate created successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() candidateData: CandidateDto,
  ) {
    if (!file) throw new BadRequestException('Resume file is required');
    return this.candidateService.createCandidate(file, candidateData);
  }

  // ── Get all candidates ─────────────────────────────────────────────────────
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all candidates with filters' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CLIENT])
  @UseGuards(RoleGuard)
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'skill', required: false, type: String })
  @ApiQuery({ name: 'experience', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'isPublic', required: false, type: String })
  @ApiQuery({ name: 'jobId', required: false, type: String })
  @ApiQuery({ name: 'location', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of candidates' })
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('skill') skill?: string,
    @Query('experience') experience?: string,
    @Query('userId') userId?: string,
    @Query('role') role?: string,
    @Query('isPublic') isPublic?: string,
    @Query('jobId') jobId?: string,
    @Query('location') location?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const isPublicBool =
      isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;

    return this.candidateService.findAll(
      pageNum,
      limitNum,
      search,
      skill,
      experience,
      userId,
      role,
      isPublicBool,
      jobId,
      location,
    );
  }

  // ── Get my applications by email ───────────────────────────────────────────
  @Get('my-applications')
  @ApiOperation({ summary: 'Get applications by candidate email' })
  @ApiQuery({ name: 'email', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Candidate applications' })
  async getMyApplications(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email query param is required');
    return this.candidateService.findByEmail(email);
  }

  // ── Update candidate status ────────────────────────────────────────────────
  @Put(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update candidate application status' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CandidateStatus,
  ) {
    return this.candidateService.updateStatus(id, status);
  }

  // ── Toggle public visibility ───────────────────────────────────────────────
  @Put(':id/public')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle public visibility of candidate' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  @ApiBody({ schema: { type: 'object', properties: { isPublic: { type: 'boolean' } } } })
  @ApiResponse({ status: 200, description: 'Visibility updated' })
  async updatePublicStatus(
    @Param('id') id: string,
    @Body('isPublic') isPublic: boolean,
    @Req() req: any,
  ) {
    const user = req.user;
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateService.findOne(id);
      await this.validateCandidateAccess(candidate, user);
    }
    return this.candidateService.updatePublicStatus(id, isPublic);
  }

  // ── Get candidate by ID ────────────────────────────────────────────────────
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get candidate by ID' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CLIENT, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  @ApiResponse({ status: 200, description: 'Candidate data' })
  async getById(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    return this.candidateService.findOne(id, user.id, user.role);
  }

  // ── Update candidate details by ID ─────────────────────────────────────────
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update candidate profile details' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  @ApiResponse({ status: 200, description: 'Candidate details updated successfully' })
  async updateCandidate(
    @Param('id') id: string,
    @Body() data: any,
    @Req() req: any,
  ) {
    const user = req.user;
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateService.findOne(id);
      await this.validateCandidateAccess(candidate, user);
    }
    return this.candidateService.updateCandidate(id, data);
  }

  // ── Delete candidate by ID ─────────────────────────────────────────────────
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete candidate by ID' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  @ApiResponse({ status: 200, description: 'Candidate deleted' })
  async deleteById(@Param('id') id: string) {
    return this.candidateService.remove(id);
  }

  // ── Force re-parse resume PDF/Word to HTML ──────────────────────────────────
  @Post(':id/reparse-resume')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Force re-parse resume PDF/Word to HTML' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  async reparseResume(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateService.findOne(id);
      await this.validateCandidateAccess(candidate, user);
    }
    return this.candidateService.reparseCandidateResume(id);
  }

  // ── Generate AI-cleaned resume doc ─────────────────────────────────────────
  @Post(':id/clean-resume')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate AI-cleaned resume doc' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  @ApiResponse({ status: 200, description: 'Cleaned resume doc details' })
  async cleanResume(@Param('id') id: string, @Req() req: any) {
    const user = req.user;
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateService.findOne(id);
      await this.validateCandidateAccess(candidate, user);
    }
    return this.candidateService.generateCleanedDoc(id);
  }

  // ── Upload cleaned resume file ─────────────────────────────────────────────
  @Post(':id/upload-cleaned')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a manually cleaned resume file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        resumeText: { type: 'string', description: 'Extracted text content' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  async uploadCleanedResume(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('resumeText') resumeText?: string,
  ) {
    const user = req.user;
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateService.findOne(id);
      await this.validateCandidateAccess(candidate, user);
    }
    return this.candidateService.uploadCleanedResume(id, file, resumeText);
  }

  // ── Update resume file or HTML ─────────────────────────────────────────────
  @Post(':id/update-resume')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update resume file or HTML text' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', nullable: true },
        resumeText: { type: 'string', nullable: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  async updateResumeFile(
    @Param('id') id: string,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
    @Body('resumeText') resumeText?: string,
  ) {
    const user = req.user;
    if (user.role === Role.CANDIDATE) {
      const candidate = await this.candidateService.findOne(id);
      await this.validateCandidateAccess(candidate, user);
    }
    return this.candidateService.updateResumeFile(id, file, resumeText);
  }

  // ── Export resume as PDF ───────────────────────────────────────────────────
  @Post('export-pdf')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export resume HTML as PDF' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CLIENT, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  @ApiBody({ schema: { type: 'object', properties: { html: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  async exportPdf(@Body('html') html: string, @Res() res: any) {
    if (!html) throw new BadRequestException('HTML content is required');
    try {
      const buffer = await this.candidateService.generatePdfFromHtml(html);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=resume.pdf',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      console.error('[export-pdf]', err);
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }

  // ── Export resume as Word ──────────────────────────────────────────────────
  @Post('export-docx')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export resume HTML as DOCX' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR, Role.CLIENT, Role.CANDIDATE])
  @UseGuards(RoleGuard)
  @ApiBody({ schema: { type: 'object', properties: { html: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'DOCX file stream' })
  async exportDocx(@Body('html') html: string, @Res() res: any) {
    if (!html) throw new BadRequestException('HTML content is required');
    try {
      const buffer = await this.candidateService.generateDocxFromHtml(html);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=resume.docx',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      console.error('[export-docx]', err);
      res.status(500).json({ error: 'Failed to export Word document' });
    }
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply to a job directly' })
  @ApiBody({ schema: { type: 'object', properties: { jobId: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Applied successfully' })
  async applyToJob(
    @Param('id') id: string,
    @Body('jobId') jobId: string,
  ) {
    return this.candidateService.applyToJob(id, jobId);
  }

  private async validateCandidateAccess(candidate: any, user: any): Promise<void> {
    if (!candidate) return;

    // 1. Matches by userId directly
    if (candidate.userId === user.id) return;

    // 2. Fallback: Matches by email address
    if (candidate.email && user.email && candidate.email.toLowerCase() === user.email.toLowerCase()) {
      // Auto-heal/sync the link in the database!
      if (!candidate.id.startsWith('user-')) {
        await this.candidateService.updateCandidate(candidate.id, { userId: user.id });
      }
      return;
    }

    // 3. Fallback: If it's a "user-" prepended mock candidate ID
    if (candidate.id === `user-${user.id}`) return;

    throw new ForbiddenException('Access denied. You can only view or modify your own candidate profile.');
  }
}
