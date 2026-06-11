import {
  Controller,
  Post,
  Body,
  UseInterceptors,Get,
  UploadedFile,
  Param,Put,
  ParseIntPipe,
  Delete
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
  async getAll(){
    return await this.candidateService.findAll()
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
}
