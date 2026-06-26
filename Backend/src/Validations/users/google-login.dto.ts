import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@Injectable()
export class GoogleLoginDto {
  @ApiProperty({ description: 'The ID Token (JWT) returned from Google OAuth Client-side SDK', example: 'eyJhbGci...' })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}
