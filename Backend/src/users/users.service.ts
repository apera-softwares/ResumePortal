import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UsersCreateDto } from 'src/Validations/users/users-create.dto';
import { LoginDto } from 'src/Validations/users/login.dto';
import { UsersUpdateDto } from 'src/Validations/users/users-update.dto';
var jwt = require('jsonwebtoken');
var md5 = require('md5');

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // create user
  async createUser(createDto: UsersCreateDto) {
    let passwordHash = md5(createDto.password);
    // console.log(passwordHash);

    let existingUser = await this.prisma.user.findUnique({
      where: {
        email: createDto.email,
      },
    });

    if (existingUser)
      throw new HttpException('user is already exist', HttpStatus.CONFLICT);

    if (createDto.role === 'ADMIN') {
      const adminExists = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (adminExists) {
        throw new HttpException(
          'Admin already exists. Only one admin is allowed.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    try {
      let createUser = await this.prisma.user.create({
        data: {
          name: createDto.name,
          email: createDto.email,
          password: passwordHash,
          role: createDto.role || 'CANDIDATE',
        },
      });
      return {
        massage: 'User Created',
        statusCode: 200,
      };
    } catch (error) {
      console.log('error', error);
      throw new HttpException('Forbidden', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // create user login
  async loginUser(loginDto: LoginDto) {
    let jwtToken;
    const getUserByEmail = await this.prisma.user.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    // console.log('JWT_SECRET =>', process.env.JWT_SECRET);

    let hashpassword = await md5(loginDto.password);
    // console.log("hash",hashpassword);

    if (!getUserByEmail) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    if (getUserByEmail.password != hashpassword) {
      throw new HttpException('Password not match', HttpStatus.BAD_REQUEST);
    }

    try {
      var token = jwt.sign(
        { user: getUserByEmail.id, role: getUserByEmail.role },
        process.env.JWT_SECRET,
      );
      jwtToken = token;

      return {
        massage: 'User login success',
        statusCode: 200,
        data: {
          id: getUserByEmail.id,
          token: jwtToken,
          name: getUserByEmail.name,
          email: getUserByEmail.email,
          role: getUserByEmail.role,
        },
      };
    } catch (error) {
      console.log('error', error);
      throw new HttpException(
        'INTERNAL SERVER ERROR',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //   get user
  async getAllUsers(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const whereCondition: any = {
      NOT: {
        role: 'ADMIN',
      },
    };

    // Optional search filter
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: {
          id: 'desc',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      }),
      this.prisma.user.count({
        where: whereCondition,
      }),
    ]);

    return {
      statusCode: 200,
      message: 'Users fetched successfully',
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  //   get user by id
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('user not found');

    return user;
  }

  // update user by id
  async updateById(id: number, usersUpdateDto: UsersUpdateDto) {
    try {
      let updateData = { ...usersUpdateDto };

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return {
        message: 'User updated successfully',
        statusCode: 200,
        data: user,
      };
    } catch (error) {
      console.log('Error updating user:', error);
      throw new HttpException(
        'User update failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // delete by id
  async deleteById(id: number) {
    try {
      const user = await this.prisma.user.delete({
        where: { id },
      });
      return {
        message: 'delete data successfully',
        statusCode: 200,
        data: user,
      };
    } catch (error) {
      console.log(error, 'error for deleting user');
      throw new HttpException(
        'user fail to delete',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
