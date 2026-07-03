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
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Role } from '@prisma/client';
import { RoleGuard } from 'src/guards/role.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { UsersCreateDto } from 'src/Validations/users/users-create.dto';
import { LoginDto } from 'src/Validations/users/login.dto';
import { UsersUpdateDto } from 'src/Validations/users/users-update.dto';


@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post('create')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  async create(@Body() createDto: UsersCreateDto) {
    return this.usersService.createUser(createDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login a user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const result = await this.usersService.loginUser(loginDto);
    response.cookie('token', result.data.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return result;
  }



  @Post('logout')
  @ApiOperation({ summary: 'Logout a user and clear the session cookie' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Res({ passthrough: true }) response: any) {
    response.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
    return { message: 'Logout successful', statusCode: 200 };
  }

  @Get('check-auth')
  @ApiOperation({ summary: 'Check if user is logged in' })
  @ApiResponse({ status: 200, description: 'User is logged in' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  async checkAuth() {
    return { loggedIn: true };
  }

  @Post('signup')
  @ApiOperation({ summary: 'Sign up a new candidate' })
  @ApiResponse({ status: 201, description: 'Candidate signed up successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async signup(@Body() signupDto: UsersCreateDto) {
    signupDto.role = Role.CANDIDATE;
    return this.usersService.createUser(signupDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    const userId = req.user.user;
    return this.usersService.getProfile(userId);
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @UseGuards(AuthGuard)
  async updateProfile(@Req() req: any, @Body() updateDto: any) {
    const userId = req.user.user;
    return this.usersService.updateProfile(userId, updateDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN, Role.HR])
  @UseGuards(RoleGuard)
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.usersService.getAllUsers(page, limit, search, role);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  getById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  updateUser(@Param('id') id: string, @Body() usersUpdateDto: UsersUpdateDto) {
    return this.usersService.updateById(id, usersUpdateDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @UseGuards(AuthGuard)
  @SetMetadata('roles', [Role.ADMIN])
  @UseGuards(RoleGuard)
  delete(@Param('id') id: string) {
    return this.usersService.deleteById(id);
  }
}
