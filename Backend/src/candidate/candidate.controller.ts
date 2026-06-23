import {
  Controller,
  Post,
  Body,
  UseInterceptors,Get,
  UploadedFile,
  Param,Put,
  ParseIntPipe,
  Delete,
  Query,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';
import { diskStorage } from 'multer';
import type { Express } from 'express'
import { extname } from 'path';
import { CandidateDto } from 'src/Validations/candidate/create-candidate.dto';


const storage = diskStorage({
  destination: './uploads',
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    const extension = extname(file.originalname);
    console.log('extension', extension);
    cb(null, file.fieldname + '-' + uniqueSuffix + `${extension}`);
  },
});

@Controller('candidates')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  // create form data upload
  @Post('uploadMedia')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(@UploadedFile() file: Express.Multer.File,@Body() candidateData: any,) {
    console.log('body', Body);
    console.log('file', file);

    return this.candidateService.uploadFileMulter(file, candidateData);
  }


  // get all candiddates
  @Get()
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('skill') skill?: string,
    @Query('experience') experience?: string,
    @Query('userId') userId?: string,
    @Query('role') role?: string,
  ){
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const userIdNum = userId ? parseInt(userId, 10) : undefined;
    return await this.candidateService.findAll(
      pageNum,
      limitNum,
      search,
      skill,
      experience,
      userIdNum,
      role,
    );
  }

  // get candidate applications by email
  @Get('my-applications')
  async getMyApplications(@Query('email') email: string) {
    return await this.candidateService.findByEmail(email);
  }

  // update candidate status by id
  @Put(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return await this.candidateService.updateStatus(id, status);
  }

  // get candidate by id
  @Get(":id")
  async getById(@Param("id", ParseIntPipe) id : number){
    return await this.candidateService.findOne(id)
  }


  // delete candidate by id
  @Delete(":id")
  async deleteById(@Param("id", ParseIntPipe) id: number){
    return await this.candidateService.remove(id)
  }

  // generate cleaned resume doc
  @Post(":id/clean-resume")
  async cleanResume(@Param("id", ParseIntPipe) id: number) {
    return await this.candidateService.generateCleanedDoc(id);
  }

  // upload cleaned resume by id
  @Post(':id/upload-cleaned')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadCleanedResume(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('resumeText') resumeText?: string,
  ) {
    return await this.candidateService.uploadCleanedResume(id, file, resumeText);
  }

  // update candidate resume file by id
  @Post(':id/update-resume')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async updateResumeFile(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
    @Body('resumeText') resumeText?: string,
  ) {
    return await this.candidateService.updateResumeFile(id, file, resumeText);
  }

  @Post('export-pdf')
  async exportPdf(@Body('html') html: string, @Res() res) {
    try {
      const buffer = await this.candidateService.generatePdfFromHtml(html);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=resume.pdf',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }

  @Post('export-docx')
  async exportDocx(@Body('html') html: string, @Res() res) {
    try {
      const buffer = await this.candidateService.generateDocxFromHtml(html);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename=resume.docx',
        'Content-Length': buffer.length,
      });
      res.end(buffer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to export Word document' });
    }
  }
}

