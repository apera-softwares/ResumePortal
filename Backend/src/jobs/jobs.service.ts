import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobDto } from 'src/Validations/job/create-job.dto';
import { UpdateJobDto } from 'src/Validations/job/update-job.dto';
import { PrismaService } from 'src/prisma.service';


@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // create job only HR and Admin
  async create(createJobDto: CreateJobDto, createdById: number) {
    try {
      const job = await this.prisma.job.create({
        data: {
          ...createJobDto,
          createdById,
        },
      });

      return {
        message: 'job created successful',
        statusCode: 201,
        data: job,
      };
      
    } catch (error) {
      console.log(error, 'job creation failed');
      throw new HttpException('job creation failed', HttpStatus.BAD_REQUEST);
    }
  }

  // get all jobs
  async findAll() {
    const jobs = await this.prisma.job.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Jobs fetched successfully',
      statusCode: 200,
      data: jobs,
    };
  }

  // get job by id
  async getJobById(id: number) {
    const job = await this.prisma.job.findUnique({
      where: {
        id,
      },
      include: {
        createdBy: true,
      },
    });

    if (!job) throw new HttpException('job not found', HttpStatus.NOT_FOUND);

    return {
      message: 'Job fetch successfully by id',
      statusCode: 200,
      data: job,
    };
  }

  // update job by id
  async update(id: number, updateJobDto: UpdateJobDto) {
    const existingJob = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob)
      throw new NotFoundException(`job not found with id : ${id}`);

    // update job record
    const updateJob = await this.prisma.job.update({
      where: { id },
      data: {
        title: updateJobDto.title,
        description: updateJobDto.description,
        client: updateJobDto.client,
        salary: updateJobDto.salary,
        skills: updateJobDto.skills,
        internalSalary: updateJobDto.internalSalary,
        location: updateJobDto.location,
        type: updateJobDto.type
      }
    });

    console.log("Updated Job ", updateJob)
    return {
      message:"job update successfully",
      statusCode: 200,
      data: updateJob
    }
  }

  // job delete by id
  async jobDeleteById(id: number) {
    try {
      await this.prisma.job.delete({ where: { id } });
      return { message: 'Job deleted successfully', statusCode: 200 };
    } catch (error) {
      throw new HttpException('failed to delete job', HttpStatus.BAD_REQUEST);
    }
  }
}
