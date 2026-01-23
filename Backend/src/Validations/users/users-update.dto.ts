import { Injectable } from "@nestjs/common";
import { Role } from "@prisma/client";
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";

@Injectable()

export class UsersUpdateDto {
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsEnum(Role)
    role: Role
}