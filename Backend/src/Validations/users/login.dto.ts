import { Injectable } from "@nestjs/common";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";


@Injectable()

export class LoginDto{
    @IsNotEmpty()
    @IsString()
    @IsEmail()
    email : string;

    @IsNotEmpty()
    @IsString()
    password: string;
}