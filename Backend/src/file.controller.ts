import { Controller, UploadedFile, UseInterceptors, Post } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { retry } from "rxjs";


@Controller('files')
export class FileController{
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file){
        if(!file){
            throw  new Error("No file uploaded");
        }
        console.log("file upload", file);
        
        return { message: 'file upload successfully'}
    }
}