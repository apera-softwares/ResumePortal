import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  SetMetadata,
  Param,
  Put,
  Delete,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { UsersCreateDto } from 'src/Validations/users/users-create.dto';
import { LoginDto } from 'src/Validations/users/login.dto';
import { UsersUpdateDto } from 'src/Validations/users/users-update.dto';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // create user
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  @Post('create')
  async create(@Body() createDto: UsersCreateDto) {
    return this.usersService.createUser(createDto);
  }

  // create login route
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.usersService.loginUser(loginDto);
  }

  // get all data
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  @Get()
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.usersService.getAllUsers(page, limit, search);
  }

  // get data by id

  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.usersService.getUserById(Number(id));
  }

  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  @Put(':id')
  updateUser(@Param('id') id: string, @Body() usersUpdateDto: UsersUpdateDto) {
    return this.usersService.updateById(Number(id), usersUpdateDto);
  }

  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.deleteById(Number(id));
  }
}
