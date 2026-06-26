import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { UsersCreateDto } from 'src/Validations/users/users-create.dto';
import { LoginDto } from 'src/Validations/users/login.dto';
import { UsersUpdateDto } from 'src/Validations/users/users-update.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class UsersService {
  private readonly googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  // ── Create User ────────────────────────────────────────────────────────────
  async createUser(createDto: UsersCreateDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: createDto.email },
    });
    if (existing) throw new ConflictException('User already exists');

    if (createDto.role === 'ADMIN') {
      const adminExists = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      if (adminExists)
        throw new ConflictException(
          'Admin already exists. Only one admin is allowed.',
        );
    }

    const passwordHash = await bcrypt.hash(createDto.password, 10);

    await this.prisma.user.create({
      data: {
        name: createDto.name,
        email: createDto.email,
        password: passwordHash,
        role: createDto.role || 'CANDIDATE',
      },
    });

    return { message: 'User created successfully', statusCode: 201 };
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async loginUser(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid =
      (await bcrypt
        .compare(loginDto.password, user.password)
        .catch(() => false)) ||
      // fallback for legacy md5-hashed passwords (seeded accounts)
      user.password === require('md5')(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const token = this.jwtService.sign(
      { user: user.id, role: user.role },
      { secret: process.env.JWT_SECRET },
    );

    return {
      message: 'Login successful',
      statusCode: 200,
      data: {
        id: user.id,
        token,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ── Google Login ──────────────────────────────────────────────────────────
  async googleLogin(idToken: string) {
    try {
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        throw new InternalServerErrorException('Google Client ID is not configured on the server.');
      }

      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid Google ID Token.');
      }

      const { email, name } = payload;

      // Find or create the user in the database
      let user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Create user with default role CANDIDATE
        user = await this.prisma.user.create({
          data: {
            name: name || 'Google User',
            email,
            password: '', // OAuth accounts do not need a password
            role: 'CANDIDATE',
          },
        });
      }

      // Generate app JWT session token
      const token = this.jwtService.sign(
        { user: user.id, role: user.role },
        { secret: process.env.JWT_SECRET },
      );

      return {
        message: 'Google login successful',
        statusCode: 200,
        data: {
          id: user.id,
          token,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new UnauthorizedException('Google token validation failed: ' + error.message);
    }
  }

  // ── Get All Users ──────────────────────────────────────────────────────────
  async getAllUsers(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = { NOT: { role: 'ADMIN' } };

    if (search?.trim()) {
      where.AND = [
        { NOT: { role: 'ADMIN' } },
        {
          OR: [
            { name: { contains: search.trim(), mode: 'insensitive' } },
            { email: { contains: search.trim(), mode: 'insensitive' } },
          ],
        },
      ];
      delete where.NOT; // replaced by AND block above
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      statusCode: 200,
      message: 'Users fetched successfully',
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Get By ID ──────────────────────────────────────────────────────────────
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return { statusCode: 200, data: user };
  }

  // ── Update By ID ───────────────────────────────────────────────────────────
  async updateById(id: string, dto: UsersUpdateDto) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');

    const updateData: any = { ...dto };
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true },
    });

    return {
      message: 'User updated successfully',
      statusCode: 200,
      data: updated,
    };
  }

  // ── Delete By ID ───────────────────────────────────────────────────────────
  async deleteById(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully', statusCode: 200 };
  }
}
