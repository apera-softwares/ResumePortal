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
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

@Injectable()
export class UsersService {

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  // ── Create User ────────────────────────────────────────────────────────────
  async createUser(createDto: UsersCreateDto) {
    const email = createDto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) throw new ConflictException('User already exists');

    const passwordHash = await bcrypt.hash(createDto.password, 10);

    const computedName = createDto.name || `${createDto.firstName || ''} ${createDto.lastName || ''}`.trim() || 'User';

    let clientId: string | null = null;
    if (createDto.role === 'CLIENT' && createDto.companyName?.trim()) {
      const trimmedName = createDto.companyName.trim();
      const existingClient = await this.prisma.client.findFirst({
        where: {
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const client = await this.prisma.client.create({
          data: { name: trimmedName },
        });
        clientId = client.id;
      }
    }

    const newUser = await this.prisma.user.create({
      data: {
        name: computedName,
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        email: email,
        password: passwordHash,
        role: createDto.role || 'CANDIDATE',
        mobile: createDto.mobile,
        clientId: clientId,
      },
    });

    if (newUser.role === 'CANDIDATE') {
      const existingCandidate = await this.prisma.candidate.findUnique({
        where: { email },
      });
      if (existingCandidate) {
        await this.prisma.candidate.update({
          where: { id: existingCandidate.id },
          data: { userId: newUser.id },
        });
      }
    }

    return { message: 'User created successfully', statusCode: 201 };
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async loginUser(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
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
      { user: user.id, role: user.role, email: user.email },
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



  // ── Get All Users ──────────────────────────────────────────────────────────
  async getAllUsers(page = 1, limit = 10, search?: string, role?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    const conditions: any[] = [{ role: { in: ['HR', 'CLIENT'] } }];

    if (role?.trim() && role.toUpperCase() !== 'ALL') {
      const targetRole = role.trim().toUpperCase();
      if (['HR', 'CLIENT'].includes(targetRole)) {
        conditions.push({ role: targetRole });
      } else {
        conditions.push({ role: 'NONE' });
      }
    }

    if (search?.trim()) {
      conditions.push({
        OR: [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { email: { contains: search.trim(), mode: 'insensitive' } },
        ],
      });
    }

    where.AND = conditions;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const mappedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      mobile: u.mobile,
      companyName: u.client?.name || null,
      createdAt: u.createdAt,
    }));

    return {
      statusCode: 200,
      message: 'Users fetched successfully',
      data: mappedUsers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ── Get By ID ──────────────────────────────────────────────────────────────
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        client: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    const mapped = {
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      companyName: user.client?.name || null,
      createdAt: user.createdAt,
    };
    return { statusCode: 200, data: mapped };
  }

  // ── Update By ID ───────────────────────────────────────────────────────────
  async updateById(id: string, dto: UsersUpdateDto) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');

    let clientId: string | null | undefined = undefined;
    if (dto.role && dto.role !== 'CLIENT') {
      clientId = null;
    } else {
      const isClient = dto.role === 'CLIENT' || (!dto.role && exists.role === 'CLIENT');
      if (isClient) {
        if (dto.companyName?.trim()) {
          const trimmedName = dto.companyName.trim();
          const existingClient = await this.prisma.client.findFirst({
            where: {
              name: {
                equals: trimmedName,
                mode: 'insensitive',
              },
            },
          });
          if (existingClient) {
            clientId = existingClient.id;
          } else {
            const client = await this.prisma.client.create({
              data: { name: trimmedName },
            });
            clientId = client.id;
          }
        } else if (dto.companyName === '') {
          clientId = null;
        }
      }
    }

    const updateData: any = { ...dto };
    delete updateData.companyName;
    if (clientId !== undefined) {
      updateData.clientId = clientId;
    }
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const newFirstName = dto.firstName !== undefined ? dto.firstName : exists.firstName;
    const newLastName = dto.lastName !== undefined ? dto.lastName : exists.lastName;
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      updateData.name = `${newFirstName || ''} ${newLastName || ''}`.trim() || exists.name;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
      },
    });

    const mapped = {
      id: updated.id,
      name: updated.name,
      firstName: updated.firstName,
      lastName: updated.lastName,
      email: updated.email,
      role: updated.role,
      mobile: updated.mobile,
      companyName: updated.client?.name || null,
    };

    return {
      message: 'User updated successfully',
      statusCode: 200,
      data: mapped,
    };
  }

  // ── Delete By ID ───────────────────────────────────────────────────────────
  async deleteById(id: string) {
    const exists = await this.prisma.user.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException('User not found');

    await this.prisma.user.delete({ where: { id } });
    return { message: 'User deleted successfully', statusCode: 200 };
  }

  // ── Profile Operations ──────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'CANDIDATE') {
      let candidate = await this.prisma.candidate.findFirst({
        where: { userId: user.id },
        include: {
          skills: { include: { skill: true } },
        },
      });

      // Self-healing: if no candidate is linked by userId, search by email and link it!
      if (!candidate) {
        const candidateByEmail = await this.prisma.candidate.findFirst({
          where: { email: user.email },
        });
        if (candidateByEmail) {
          candidate = await this.prisma.candidate.update({
            where: { id: candidateByEmail.id },
            data: { userId: user.id },
            include: {
              skills: { include: { skill: true } },
            },
          });
        }
      }

      let presignedUrl: string | null = null;
      if (candidate && candidate.resume) {
        try {
          const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: candidate.resume,
          });
          presignedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
        } catch (s3Error) {
          console.error('[getProfile] Failed to generate signed URL:', s3Error);
        }
      }

      return {
        statusCode: 200,
        data: {
          user,
          candidate,
          resumePdf: presignedUrl
        },
      };
    }

    return {
      statusCode: 200,
      data: {
        user,
      },
    };
  }

  async updateProfile(userId: string, updateDto: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user details
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: updateDto.name !== undefined ? updateDto.name : user.name,
        email: updateDto.email !== undefined ? updateDto.email : user.email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (user.role === 'CANDIDATE') {
      let candidate = await this.prisma.candidate.findFirst({
        where: { userId: user.id },
      });

      const cData = updateDto.candidate || {};
      let firstName = cData.firstName;
      let lastName = cData.lastName;

      if (!firstName && !lastName && updateDto.name) {
        const parts = updateDto.name.trim().split(/\s+/);
        firstName = parts[0] || '';
        lastName = parts.slice(1).join(' ') || '';
      }

      if (candidate) {
        const updatedCandidate = await this.prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            firstName: firstName !== undefined ? firstName : candidate.firstName,
            lastName: lastName !== undefined ? lastName : candidate.lastName,
            email: updateDto.email !== undefined ? updateDto.email : candidate.email,
            mobile: cData.mobile !== undefined ? cData.mobile : candidate.mobile,
            yearsOfExperience: cData.yearsOfExperience !== undefined ? Number(cData.yearsOfExperience) : candidate.yearsOfExperience,
            education: cData.education !== undefined ? cData.education : candidate.education,
            noticePeriod: cData.noticePeriod !== undefined ? Number(cData.noticePeriod) : candidate.noticePeriod,
            currentLocation: cData.currentLocation !== undefined ? cData.currentLocation : candidate.currentLocation,
            preferredWorkMode: cData.preferredWorkMode !== undefined ? cData.preferredWorkMode : candidate.preferredWorkMode,
            budget: cData.budget !== undefined ? cData.budget : candidate.budget,
            expectedCtc: cData.expectedCtc !== undefined ? Number(cData.expectedCtc) : candidate.expectedCtc,
            currentCtc: cData.currentCtc !== undefined ? Number(cData.currentCtc) : candidate.currentCtc,
          },
        });

        return {
          statusCode: 200,
          message: 'Profile updated successfully',
          data: {
            user: updatedUser,
            candidate: updatedCandidate,
          },
        };
      }
    }

    return {
      statusCode: 200,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser,
      },
    };
  }
}
