// src/candidate/candidate.service.ts
import 'dotenv/config';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { $Enums } from '@prisma/client';
type CandidateStatus = $Enums.CandidateStatus;
import { CandidateDto } from 'src/Validations/candidate/create-candidate.dto';
import { join } from 'path';
import { extname } from 'path';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import * as libre from 'libreoffice-convert';
import { promisify } from 'util';
import { execSync } from 'child_process';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { CandidateCreatedEvent } from 'src/envent/events';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});

@Injectable()
export class CandidateService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  async uploadFileMulter(
    file: Express.Multer.File,
    candidateData: CandidateDto,
  ): Promise<any> {
    console.log('File ', file);

    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = extname(file.originalname);

    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(
        'Invalid file type. Only PDF and Word documents are allowed.',
      );
    }

    // ── Upload resume to R2/S3 before touching the database ──────────────────
    const resumeKey = `${Date.now()}-${file.originalname}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: resumeKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await client.send(uploadCommand);
    // ─────────────────────────────────────────────────────────────────────────

    // Use the R2/S3 key as the resume identifier
    const uniqueFileName = resumeKey;

    const yearsOfExperience = Number(candidateData.yearsOfExperience);
    const noticePeriod = Number(candidateData.noticePeriod);
    const expectedCtc = candidateData.expectedCtc ? Number(candidateData.expectedCtc) : null;
    const currentCtc = candidateData.currentCtc ? Number(candidateData.currentCtc) : null;

    let skillsArray: string[] = [];

    if (candidateData.skills) {
      if (typeof candidateData.skills === 'string') {
        skillsArray = candidateData.skills.split(',').map((s) => s.trim());
      } else if (Array.isArray(candidateData.skills)) {
        skillsArray = candidateData.skills.map((s) => s.trim());
      }
    }

    let preferredJobLocationsArray: string[] = [];
    if (candidateData.preferredJobLocations) {
      if (typeof candidateData.preferredJobLocations === 'string') {
        preferredJobLocationsArray = candidateData.preferredJobLocations
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);
      } else if (Array.isArray(candidateData.preferredJobLocations)) {
        preferredJobLocationsArray = candidateData.preferredJobLocations
          .map((l: any) => String(l).trim())
          .filter(Boolean);
      }
    }

    const emailLower = candidateData.email.trim().toLowerCase();

    // Check if user with this email exists to link candidate profile
    const associatedUser = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    // Check if candidate with this email already exists to avoid unique constraint violations
    const existingCandidate = await this.prisma.candidate.findUnique({
      where: { email: emailLower },
    });

    if (existingCandidate) {
      // Delete old resume file if it exists and is different from the newly uploaded one
      if (
        existingCandidate.resume &&
        existingCandidate.resume !== file.filename
      ) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: existingCandidate.resume,
          });
          await client.send(deleteCommand);
        } catch (err) {
          console.error(
            `Error deleting old resume from R2/S3: ${existingCandidate.resume}`,
            err,
          );
        }

        const oldFilePath = join(
          process.cwd(),
          'uploads',
          existingCandidate.resume,
        );
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (err) {
          console.error(
            `Error deleting old local resume file: ${existingCandidate.resume}`,
            err,
          );
        }
      }

      // Update candidate record
      const updatedCandidate = await this.prisma.candidate.update({
        where: { id: existingCandidate.id },
        data: {
          firstName: candidateData.firstName,
          lastName: candidateData.lastName,
          mobile: candidateData.mobile,
          yearsOfExperience,
          education: candidateData.education,
          noticePeriod,
          currentLocation: candidateData.currentLocation || null,
          preferredWorkMode: candidateData.preferredWorkMode || null,
          budget: candidateData.budget || null,
          preferredJobLocations: preferredJobLocationsArray,
          expectedCtc,
          currentCtc,
          resume: resumeKey,
          resumeText: '', // reset and parse asynchronously via event
          userId: associatedUser ? associatedUser.id : (existingCandidate.userId || null),
          skills: {
            deleteMany: {}, // clear existing skills associations
            create: skillsArray.map((name) => ({
              skill: {
                connectOrCreate: {
                  where: { name },
                  create: { name },
                },
              },
            })),
          },
          ...((candidateData as any).jobId
            ? {
              appliedJobs: {
                connectOrCreate: {
                  where: {
                    candidateId_jobId: {
                      candidateId: existingCandidate.id,
                      jobId: String((candidateData as any).jobId),
                    },
                  },
                  create: { jobId: String((candidateData as any).jobId) },
                },
              },
            }
            : {}),
        },
        include: {
          skills: { include: { skill: true } },
          appliedJobs: { include: { job: true } },
        },
      });

      console.log('Updated Candidate: ', updatedCandidate);

      // Emit candidate.created event for asynchronous text extraction
      this.eventEmitter.emit(
        'candidate.created',
        new CandidateCreatedEvent(updatedCandidate.id),
      );

      return this.mapCandidate(updatedCandidate);
    }

    // Create a new candidate record in the database
    const createdCandidate = await this.prisma.candidate.create({
      data: {
        firstName: candidateData.firstName,
        lastName: candidateData.lastName,
        mobile: candidateData.mobile,
        email: emailLower,
        yearsOfExperience,
        education: candidateData.education,
        noticePeriod,
        currentLocation: candidateData.currentLocation || null,
        preferredWorkMode: candidateData.preferredWorkMode || null,
        budget: candidateData.budget || null,
        preferredJobLocations: preferredJobLocationsArray,
        expectedCtc,
        currentCtc,
        resume: resumeKey,
        resumeText: '', // initially empty, parsed in event handler
        userId: associatedUser ? associatedUser.id : null,
        skills: {
          create: skillsArray.map((name) => ({
            skill: {
              connectOrCreate: {
                where: { name },
                create: { name },
              },
            },
          })),
        },
        ...((candidateData as any).jobId
          ? {
            appliedJobs: {
              create: { jobId: String((candidateData as any).jobId) },
            },
          }
          : {}),
      },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
    });

    console.log('Created Candidate: ', createdCandidate);

    // Emit candidate.created event for asynchronous text extraction
    this.eventEmitter.emit(
      'candidate.created',
      new CandidateCreatedEvent(createdCandidate.id),
    );

    return this.mapCandidate(createdCandidate);
  }

  // get all candidate
  async findAll(
    page?: number,
    limit?: number,
    search?: string,
    skill?: string,
    experience?: string,
    userId?: string,
    role?: string,
    isPublic?: boolean,
    jobId?: string,
    location?: string,
  ) {
    const where: any = {};
    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    const andConditions: any[] = [];

    // 1. Job Filter or Company User filter
    const roleUpper = role?.toUpperCase();
    if (roleUpper === 'CLIENT' && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (user?.clientId) {
        if (jobId) {
          andConditions.push({
            appliedJobs: {
              some: {
                jobId: jobId,
                job: {
                  clientId: user.clientId,
                },
              },
            },
          });
        } else {
          andConditions.push({
            appliedJobs: {
              some: {
                job: {
                  clientId: user.clientId,
                },
              },
            },
          });
        }
      } else {
        andConditions.push({
          id: 'none',
        });
      }
    } else if (jobId) {
      andConditions.push({
        appliedJobs: {
          some: { jobId: jobId },
        },
      });
    } else if (roleUpper && roleUpper !== 'ADMIN' && userId) {
      andConditions.push({
        appliedJobs: {
          some: {
            job: { createdById: userId },
          },
        },
      });
    }

    // 2. Skill Filter
    if (skill) {
      const skillList = skill.split(',').map(s => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        andConditions.push({
          skills: {
            some: {
              skill: {
                OR: skillList.map(s => ({
                  name: { equals: s, mode: 'insensitive' }
                }))
              }
            }
          }
        });
      }
    }

    // 3. Experience Filter
    if (experience) {
      if (experience === 'fresher') {
        andConditions.push({ yearsOfExperience: 0 });
      } else if (experience === '0-1') {
        andConditions.push({ yearsOfExperience: { gte: 0, lte: 1 } });
      } else if (experience === '1-2') {
        andConditions.push({ yearsOfExperience: { gte: 1, lte: 2 } });
      } else if (experience === '2-3') {
        andConditions.push({ yearsOfExperience: { gte: 2, lte: 3 } });
      } else if (experience === '3-5') {
        andConditions.push({ yearsOfExperience: { gte: 3, lte: 5 } });
      } else if (experience === '5-7') {
        andConditions.push({ yearsOfExperience: { gte: 5, lte: 7 } });
      } else if (experience === '7-10') {
        andConditions.push({ yearsOfExperience: { gte: 7, lte: 10 } });
      } else if (experience === '10-12') {
        andConditions.push({ yearsOfExperience: { gte: 10, lte: 12 } });
      } else if (experience === '12-15') {
        andConditions.push({ yearsOfExperience: { gte: 12, lte: 15 } });
      } else if (experience === '15+') {
        andConditions.push({ yearsOfExperience: { gte: 15 } });
      }
    }

    // 4. Search Term Filter
    if (search && search.trim()) {
      const term = search.trim();
      const words = term.split(/\s+/).filter(Boolean);

      const searchConditions: any[] = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term, mode: 'insensitive' } },
        { education: { contains: term, mode: 'insensitive' } },
        { resumeText: { contains: term, mode: 'insensitive' } },
        {
          skills: {
            some: {
              skill: {
                name: { contains: term, mode: 'insensitive' },
              },
            },
          },
        },
      ];

      // Support searching by full name (e.g., "Trushant Kose")
      if (words.length > 1) {
        searchConditions.push({
          AND: [
            { firstName: { contains: words[0], mode: 'insensitive' } },
            { lastName: { contains: words.slice(1).join(' '), mode: 'insensitive' } },
          ],
        });
      }

      andConditions.push({
        OR: searchConditions,
      });
    }

    // 5. Location Filter
    if (location && location.trim() !== '') {
      const locationList = location.split(',').map(l => l.trim().toUpperCase()).filter(Boolean);
      if (locationList.length > 0) {
        andConditions.push({
          OR: [
            ...locationList.map(loc => ({
              currentLocation: { equals: loc, mode: 'insensitive' }
            })),
            {
              preferredJobLocations: {
                hasSome: locationList
              }
            }
          ]
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Fetch matching Candidates (all) and candidate Users (all)
    const [candidates, candidateUsers] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        include: {
          skills: { include: { skill: true } },
          appliedJobs: { include: { job: true } },
        },
        orderBy: {
          id: 'desc',
        },
      }),
      this.prisma.user.findMany({
        where: { role: 'CANDIDATE' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
    ]);

    const mappedCandidates = candidates.map((c) => this.mapCandidate(c));

    // Synthesize candidates from candidateUsers who don't have a Candidate record
    const existingEmails = new Set(mappedCandidates.map((c) => c.email.toLowerCase()));
    const existingUserIds = new Set(mappedCandidates.map((c) => c.userId).filter(Boolean));

    const synthesizedCandidates = roleUpper === 'CLIENT' ? [] : candidateUsers
      .filter((user) => !existingEmails.has(user.email.toLowerCase()) && !existingUserIds.has(user.id))
      .map((user) => {
        const parts = user.name.trim().split(/\s+/);
        const firstName = parts[0] || 'Candidate';
        const lastName = parts.slice(1).join(' ') || '';
        return {
          id: `user-${user.id}`,
          firstName,
          lastName,
          email: user.email,
          mobile: '',
          yearsOfExperience: 0,
          education: '',
          noticePeriod: 0,
          currentLocation: '',
          preferredWorkMode: '',
          budget: '',
          preferredJobLocations: [],
          expectedCtc: null,
          currentCtc: null,
          resume: '',
          resumeText: '',
          cleanedResume: null,
          resumeJson: null,
          editedHtml: null,
          parsedHtml: null,
          isPublic: false,
          userId: user.id,
          appliedJobs: [],
          skills: [],
          createdAt: user.createdAt,
          updatedAt: user.createdAt,
        };
      });

    // Merge both
    let allCandidates = [...mappedCandidates, ...synthesizedCandidates];

    // Filter synthesized candidates if we have filters that they wouldn't match
    if (isPublic !== undefined) {
      allCandidates = allCandidates.filter((c) => c.isPublic === isPublic);
    }
    if (jobId) {
      allCandidates = allCandidates.filter((c) => c.appliedJobs.some((aj: any) => aj.jobId === jobId));
    }
    if (skill) {
      const skillList = skill.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (skillList.length > 0) {
        allCandidates = allCandidates.filter((c) =>
          c.skills.some((s: any) => skillList.includes(s.name.toLowerCase())),
        );
      }
    }
    if (experience) {
      allCandidates = allCandidates.filter((c) => {
        const exp = c.yearsOfExperience;
        if (experience === 'fresher') return exp === 0;
        if (experience === '0-1') return exp >= 0 && exp <= 1;
        if (experience === '1-2') return exp >= 1 && exp <= 2;
        if (experience === '2-3') return exp >= 2 && exp <= 3;
        if (experience === '3-5') return exp >= 3 && exp <= 5;
        if (experience === '5-7') return exp >= 5 && exp <= 7;
        if (experience === '7-10') return exp >= 7 && exp <= 10;
        if (experience === '10-12') return exp >= 10 && exp <= 12;
        if (experience === '12-15') return exp >= 12 && exp <= 15;
        if (experience === '15+') return exp >= 15;
        return true;
      });
    }
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      const words = term.split(/\s+/).filter(Boolean);
      allCandidates = allCandidates.filter((c) => {
        const matchesField =
          c.firstName.toLowerCase().includes(term) ||
          c.lastName.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.mobile && c.mobile.includes(term)) ||
          (c.education && c.education.toLowerCase().includes(term)) ||
          (c.resumeText && c.resumeText.toLowerCase().includes(term)) ||
          c.skills.some((s: any) => s.name.toLowerCase().includes(term));

        if (matchesField) return true;

        if (words.length > 1) {
          const firstWord = words[0];
          const remaining = words.slice(1).join(' ');
          if (
            c.firstName.toLowerCase().includes(firstWord) &&
            c.lastName.toLowerCase().includes(remaining)
          ) {
            return true;
          }
        }
        return false;
      });
    }
    if (location && location.trim() !== '') {
      const locationList = location.split(',').map((l) => l.trim().toLowerCase()).filter(Boolean);
      if (locationList.length > 0) {
        allCandidates = allCandidates.filter((c) => {
          const matchesCurrent =
            c.currentLocation && locationList.includes(c.currentLocation.toLowerCase());
          const matchesPreferred =
            c.preferredJobLocations &&
            c.preferredJobLocations.some((l: string) => locationList.includes(l.toLowerCase()));
          return matchesCurrent || matchesPreferred;
        });
      }
    }

    // Sort by createdAt desc
    allCandidates.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    const total = allCandidates.length;
    const pageNum = page || 1;
    const limitNum = limit || total;
    const totalPages = Math.ceil(total / limitNum);

    const paginatedCandidates = allCandidates.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    return {
      data: paginatedCandidates,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  }

  // Get candidate by ID
  async findOne(id: string, userId?: string, role?: string) {
    const roleUpper = role?.toUpperCase();
    if (id.startsWith('user-')) {
      if (roleUpper === 'CLIENT') {
        throw new ForbiddenException('Access denied. You do not have permission to view this profile.');
      }
      const userIdFromMock = id.replace('user-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userIdFromMock },
      });
      if (!user) throw new NotFoundException(`User with ID ${userIdFromMock} not found`);
      const parts = user.name.trim().split(/\s+/);
      const firstName = parts[0] || 'Candidate';
      const lastName = parts.slice(1).join(' ') || '';
      return {
        id,
        firstName,
        lastName,
        email: user.email,
        mobile: '',
        yearsOfExperience: 0,
        education: '',
        noticePeriod: 0,
        currentLocation: '',
        preferredWorkMode: '',
        budget: '',
        preferredJobLocations: [],
        expectedCtc: null,
        currentCtc: null,
        resume: '',
        resumeText: '',
        cleanedResume: null,
        resumeJson: null,
        editedHtml: null,
        parsedHtml: null,
        isPublic: false,
        userId: user.id,
        appliedJobs: [],
        skills: [],
        createdAt: user.createdAt,
        updatedAt: user.createdAt,
      };
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: { include: { client: true } } } },
      },
    });

    if (!candidate) throw new NotFoundException(`Candidate with ID ${id} not found`);

    if (roleUpper === 'CLIENT' && userId) {
      const userObj = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!userObj?.clientId) {
        throw new ForbiddenException('Access denied. No company associated with your client account.');
      }
      const hasAppliedToClientJob = candidate.appliedJobs.some(
        (aj) => aj.job?.clientId === userObj.clientId,
      );
      if (!hasAppliedToClientJob) {
        throw new ForbiddenException('Access denied. You do not have permission to view this candidate.');
      }
    }

    if (roleUpper === 'CANDIDATE' && userId) {
      const userObj = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      const isOwner =
        candidate.userId === userId ||
        (candidate.email && userObj?.email && candidate.email.toLowerCase() === userObj.email.toLowerCase()) ||
        candidate.id === `user-${userId}`;

      if (!isOwner) {
        throw new ForbiddenException('Access denied. You can only view your own candidate profile.');
      }

      // Auto-heal link
      if (candidate.userId !== userId && candidate.email && userObj?.email && candidate.email.toLowerCase() === userObj.email.toLowerCase() && !candidate.id.startsWith('user-')) {
        await this.prisma.candidate.update({
          where: { id: candidate.id },
          data: { userId },
        });
      }
    }

    return this.mapCandidate(candidate);
  }

  // delete candidate by id
  async remove(id: string) {
    if (id.startsWith('user-')) {
      const userId = id.replace('user-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`Candidate with ID ${id} not found`);
      }
      return await this.prisma.user.delete({
        where: { id: userId },
      });
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    // Clean up S3/R2 and local files
    if (candidate.resume) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: candidate.resume,
        });
        await client.send(deleteCommand);
      } catch (err) {
        console.error(
          `Error deleting resume from R2/S3 during candidate removal: ${candidate.resume}`,
          err,
        );
      }

      const localPath = join(process.cwd(), 'uploads', candidate.resume);
      try {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (err) { }
    }

    if (candidate.cleanedResume) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: candidate.cleanedResume,
        });
        await client.send(deleteCommand);
      } catch (err) {
        console.error(
          `Error deleting cleaned resume from R2/S3 during candidate removal: ${candidate.cleanedResume}`,
          err,
        );
      }

      const localPath = join(process.cwd(), 'uploads', candidate.cleanedResume);
      try {
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      } catch (err) { }
    }

    return await this.prisma.candidate.delete({
      where: { id },
    });
  }

  private mapCandidate(candidate: any) {
    if (!candidate) return null;

    // Calculate the LPM budget from the raw LPA string input
    // Formula: Value LPA / 12 months = monthly amount; monthly amount + 20% margin = LPM
    // Example: 12 LPA -> 60,000 PM + 20% = 72,000 LPM (which displays on the candidate table as 72KPM)
    let calculatedBudget: string | null = null;
    if (candidate.budget) {
      const match = candidate.budget.match(/(\d+(\.\d+)?)/);
      if (match) {
        const val = parseFloat(match[1]);
        // 12 LPA = 1,200,000 / 12 months = 100,000 PM. 100,000 + 20% = 120,000 LPM (₹1,20,000/month)
        const monthly = (val * 100000) / 12;
        const withTwentyPercent = monthly * 1.2;
        const formatted = new Intl.NumberFormat('en-IN').format(Math.round(withTwentyPercent));
        calculatedBudget = `₹${formatted}`;
      }
    }

    return {
      ...candidate,
      calculatedBudget,
      skills: (candidate.skills || []).map((cs: any) => ({
        id: cs.skill?.id || cs.skillId,
        name: cs.skill?.name || cs.name || '',
      })),
    };
  }

  private cleanContactDetails(text: string): string {
    if (!text) return '';

    // Regex for emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Regex for phone numbers (matches standard pattern with country code, area codes, spaces, dashes, parentheses)
    const phoneRegex =
      /(\(?\+?\d{1,4}\)?[-.\s]*)?\(?\d{2,5}\)?[-.\s()]*\d{3,4}[-.\s()]*\d{2,4}/g;

    let cleaned = text.replace(emailRegex, '');
    cleaned = cleaned.replace(phoneRegex, '');

    return cleaned;
  }

  async generateCleanedDoc(id: string): Promise<any> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    if (!candidate.resumeText) {
      throw new NotFoundException(
        `Candidate with ID ${id} does not have any resume text to clean`,
      );
    }

    let plainText = candidate.resumeText;
    const isHtml = /<[a-z][\s\S]*>/i.test(plainText);
    if (isHtml) {
      plainText = plainText
        .replace(/<\/p>/g, '\n')
        .replace(/<br\s*\/?>/g, '\n')
        .replace(/<[^>]*>/g, '');
    }

    const cleanedText = this.cleanContactDetails(plainText);

    // Generate docx
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: cleanedText.split('\n').map((line) => {
            return new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24, // 24 half-points = 12pt font size
                }),
              ],
            });
          }),
        },
      ],
    });

    const docxBuffer = await Packer.toBuffer(doc);

    const fileName = `cleaned-resume-${id}-${Date.now()}.docx`;
    const filePath = join(process.cwd(), 'uploads', fileName);

    fs.writeFileSync(filePath, docxBuffer);

    // Save the doc link/filename in DB
    const updatedCandidate = await this.prisma.candidate.update({
      where: { id },
      data: {
        cleanedResume: fileName,
      },
      include: {
        skills: { include: { skill: true } },
      },
    });

    return this.mapCandidate(updatedCandidate);
  }

  async findByEmail(email: string) {
    if (!email) return [];
    const emailLower = email.trim().toLowerCase();
    const candidates = await this.prisma.candidate.findMany({
      where: { email: emailLower },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return candidates.map((c) => this.mapCandidate(c));
  }

  async updateStatus(id: string, status: CandidateStatus) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    // Update status for all applications associated with this candidate
    await this.prisma.appliedJob.updateMany({
      where: { candidateId: id },
      data: { status },
    });

    const updated = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
    });
    return this.mapCandidate(updated);
  }

  async updatePublicStatus(id: string, isPublic: boolean) {
    let candidate: any = null;

    if (id.startsWith('user-')) {
      const userId = id.replace('user-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

      candidate = await this.prisma.candidate.findUnique({
        where: { email: user.email },
      });

      if (!candidate) {
        const parts = user.name.trim().split(/\s+/);
        const firstName = parts[0] || 'Candidate';
        const lastName = parts.slice(1).join(' ') || '';

        candidate = await this.prisma.candidate.create({
          data: {
            firstName,
            lastName,
            email: user.email,
            yearsOfExperience: 0,
            noticePeriod: 0,
            resume: '',
            userId: user.id,
            isPublic,
          },
        });
        return this.mapCandidate(candidate);
      }
    } else {
      candidate = await this.prisma.candidate.findUnique({
        where: { id },
      });
    }

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    const updated = await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: { isPublic },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
    });
    return this.mapCandidate(updated);
  }

  async uploadCleanedResume(
    id: string,
    file: Express.Multer.File,
    resumeText?: string,
  ): Promise<any> {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(
        'Invalid file type. Only PDF and Word documents are allowed.',
      );
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    const cleanedKey = `cleaned-${Date.now()}-${file.originalname}`;

    // Upload to S3/R2
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: cleanedKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await client.send(uploadCommand);

    // Delete old cleaned resume file if it exists
    if (candidate.cleanedResume) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: candidate.cleanedResume,
        });
        await client.send(deleteCommand);
      } catch (err) {
        console.error(
          `Error deleting old cleaned resume from R2/S3: ${candidate.cleanedResume}`,
          err,
        );
      }

      const oldFilePath = join(
        process.cwd(),
        'uploads',
        candidate.cleanedResume,
      );
      try {
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (err) {
        console.error(
          `Error deleting old local cleaned resume file: ${candidate.cleanedResume}`,
          err,
        );
      }
    }

    // Extract text from the new file: write buffer to a temp file, extract, then delete temp file
    let extractedText = '';
    const tempFilePath = join(process.cwd(), 'uploads', cleanedKey);
    try {
      const dir = join(process.cwd(), 'uploads');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(tempFilePath, file.buffer);

      if (fileExtension === '.pdf') {
        const outputDir = join(process.cwd(), 'uploads');
        const htmlFileName = cleanedKey.replace(/\.pdf$/i, '.html');
        const htmlFilePath = join(outputDir, htmlFileName);

        try {
          // Convert to HTML using pdftohtml to preserve exact styles, positions, and fonts
          const command = `pdftohtml -s -noframes -c -dataurls "${tempFilePath}" "${htmlFilePath}"`;
          execSync(command);

          if (fs.existsSync(htmlFilePath)) {
            const rawHtml = fs.readFileSync(htmlFilePath, 'utf8');
            extractedText = cleanPdftohtmlOutline(rawHtml);
            fs.unlinkSync(htmlFilePath);
            console.log(
              `[Cleaned Upload] pdftohtml conversion succeeded for candidate ID: ${id}`,
            );
          }
        } catch (execError) {
          console.error(
            '[Cleaned Upload] pdftohtml conversion failed:',
            execError.message,
          );
        }
      } else if (fileExtension === '.docx' || fileExtension === '.doc') {
        const outputDir = join(process.cwd(), 'uploads');
        const htmlFileName = cleanedKey.replace(/\.(docx|doc)$/i, '.html');
        const htmlFilePath = join(outputDir, htmlFileName);

        try {
          // Convert to HTML using headless LibreOffice to preserve exact layout and styles of Word files
          const command = `libreoffice --headless --convert-to html --outdir "${outputDir}" "${tempFilePath}"`;
          execSync(command);

          if (fs.existsSync(htmlFilePath)) {
            extractedText = fs.readFileSync(htmlFilePath, 'utf8');
            fs.unlinkSync(htmlFilePath);
            console.log(
              `[Cleaned Upload] LibreOffice Word-to-HTML conversion succeeded for candidate ID: ${id}`,
            );
          }
        } catch (libreOfficeError) {
          console.warn(
            '[Cleaned Upload] LibreOffice conversion failed, falling back to Mammoth:',
            libreOfficeError.message,
          );
          try {
            const result = await mammoth.convertToHtml({ buffer: file.buffer });
            extractedText = result.value || '';
          } catch (mammothError) {
            console.error(
              '[Cleaned Upload] Fallback Mammoth DOCX conversion failed:',
              mammothError,
            );
          }
        }
      }
    } catch (error) {
      console.error(
        'Error extracting text from uploaded cleaned resume:',
        error,
      );
    } finally {
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (err) { }
    }

    // Update candidate record
    const updated = await this.prisma.candidate.update({
      where: { id },
      data: {
        cleanedResume: cleanedKey,
        resumeText: extractedText || resumeText || undefined,
      },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
    });
    return this.mapCandidate(updated);
  }

  /**
   * Generates a high-quality PDF buffer from HTML content using Puppeteer headless browser.
   */
  async generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });
    try {
      const page = await browser.newPage();

      const isFullHtml = /<!DOCTYPE html|<html/i.test(htmlContent);
      const isAbsolute = /position:\s*absolute/i.test(htmlContent);

      let finalHtml = htmlContent;
      let pdfOptions: any = {
        printBackground: true,
      };

      let pageWidth = 'A4';
      let pageHeight = '';
      let isCustomSize = false;

      if (isFullHtml) {
        if (isAbsolute) {
          let pageDivMatch = htmlContent.match(/id="page\d+-div"[^>]+style="([^"]+)"/i);
          if (!pageDivMatch) {
            pageDivMatch = htmlContent.match(/<div[^>]+style="([^"]*position:\s*relative[^"]*)"/i);
          }
          if (pageDivMatch) {
            const styleAttr = pageDivMatch[1];
            const wMatch = styleAttr.match(/width:\s*(\d+)px/i);
            const hMatch = styleAttr.match(/height:\s*(\d+)px/i);
            if (wMatch && hMatch) {
              const wVal = parseInt(wMatch[1], 10);
              const hVal = parseInt(hMatch[1], 10);
              if (wVal > 300 && hVal > 300) {
                pageWidth = `${wVal}px`;
                pageHeight = `${hVal}px`;
                isCustomSize = true;
              }
            }
          }
        }

        // 1. Move all style blocks to head
        const styles: string[] = [];
        finalHtml = finalHtml.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match) => {
          styles.push(match);
          return '';
        });

        // 2. Inject print style overrides
        if (isAbsolute) {
          styles.push(`
            <style>
              @page {
                size: ${isCustomSize ? `${pageWidth} ${pageHeight}` : 'A4'};
                margin: 0 !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
                overflow: hidden !important;
                background: white !important;
                background-color: white !important;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              div[id$="-div"], div[id^="page"] {
                margin: 0 !important;
                padding: 0 !important;
                box-shadow: none !important;
                border: none !important;
                background: white !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              div[id$="-div"]:last-child, div[id^="page"]:last-child {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
            </style>
          `);
        }

        const stylesString = styles.join('\n');
        if (finalHtml.includes('</head>')) {
          finalHtml = finalHtml.replace(/<\/head>/i, `${stylesString}</head>`);
        } else if (finalHtml.includes('<head>')) {
          finalHtml = finalHtml.replace(/<head>/i, `<head>${stylesString}`);
        } else {
          finalHtml = `<head>${stylesString}</head>${finalHtml}`;
        }

        // 3. Clean body content (remove empty spacers and trim)
        finalHtml = finalHtml.replace(/<body([^>]*)>([\s\S]*?)<\/body>/i, (match, bodyAttrs, bodyContent) => {
          let cleanedContent = bodyContent.trim();
          cleanedContent = cleanedContent.replace(/<!-- Page \d+ -->/g, '');
          cleanedContent = cleanedContent.replace(/<a name="\d+"><\/a>/g, '');
          cleanedContent = cleanedContent.trim();
          // Remove any whitespace between page divs to prevent spacing nodes
          cleanedContent = cleanedContent.replace(/<\/div>\s+<div/g, '</div><div');
          return `<body${bodyAttrs}>${cleanedContent}</body>`;
        });

        if (isAbsolute) {
          if (isCustomSize) {
            pdfOptions.width = pageWidth;
            pdfOptions.height = pageHeight;
          } else {
            pdfOptions.format = 'A4';
          }
          pdfOptions.margin = { top: 0, bottom: 0, left: 0, right: 0 };
        } else {
          pdfOptions.format = 'A4';
        }
      } else {
        finalHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                font-family: Arial, Helvetica, sans-serif;
                line-height: 1.4;
                color: #2c3e50;
                background-color: #ffffff;
              }
              p { margin: 0 0 8px 0; }
              h1, h2, h3, h4, h5, h6 { 
                color: #2c3e50; 
                margin-top: 15px; 
                margin-bottom: 8px;
                font-weight: bold;
              }
              h1 { font-size: 24px; text-align: center; border-bottom: 2px solid #2c3e50; padding-bottom: 5px; }
              h2 { font-size: 18px; border-bottom: 1.5px solid #bdc3c7; padding-bottom: 3px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              td { padding: 4px; vertical-align: top; }
              ul, ol { margin: 5px 0; padding-left: 20px; }
              li { margin-bottom: 4px; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
          </html>
        `;
        pdfOptions.format = 'A4';
      }

      if (isFullHtml && isAbsolute && isCustomSize) {
        const widthVal = parseInt(pageWidth, 10) || 800;
        const heightVal = parseInt(pageHeight, 10) || 1200;
        await page.setViewport({
          width: widthVal,
          height: heightVal,
          deviceScaleFactor: 1,
        });
      } else {
        await page.setViewport({
          width: 800,
          height: 1130,
          deviceScaleFactor: 1,
        });
      }

      await page.setContent(finalHtml, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf(pdfOptions);
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generates a DOCX document buffer from HTML content.
   */
  async generateDocxFromHtml(htmlContent: string): Promise<Buffer> {
    const puppeteer = require('puppeteer');
    const htmlToDocx = require('html-to-docx');

    let cleanSemanticHtml = '';
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent || '<div></div>', {
        waitUntil: 'networkidle0',
      });

      // Reconstruct document in visual reading order (top-to-bottom, left-to-right)
      cleanSemanticHtml = await page.evaluate(() => {
        // Find all text elements (p, div, span, etc.)
        const elements = Array.from(
          document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li'),
        );

        // Filter out elements that don't have direct text, or are layout containers
        const textNodes = elements.filter((el) => {
          const hasChildElement = Array.from(el.children).some((child) =>
            ['P', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'LI'].includes(
              child.tagName,
            ),
          );
          const hasText = el.textContent && el.textContent.trim().length > 0;
          const isBase64 = el.innerHTML.includes('data:image');
          return hasText && !hasChildElement && !isBase64;
        });

        // Get bounding boxes of all text elements
        const positionedItems = textNodes.map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            text: el.textContent ? el.textContent.trim() : '',
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            fontSize: window.getComputedStyle(el).fontSize,
            fontWeight: window.getComputedStyle(el).fontWeight,
          };
        });

        // Split items into Left Column (Sidebar) and Right Column (Main)
        // Divider: 300px (to align sidebar boundary nicely)
        const leftItems = positionedItems.filter((item) => item.left < 300);
        const rightItems = positionedItems.filter((item) => item.left >= 300);

        // Group left column items into lines
        const leftLines: { top: number; items: typeof leftItems }[] = [];
        leftItems.forEach((item) => {
          const foundLine = leftLines.find(
            (line) => Math.abs(line.top - item.top) < 6,
          );
          if (foundLine) {
            foundLine.items.push(item);
          } else {
            leftLines.push({ top: item.top, items: [item] });
          }
        });
        leftLines.sort((a, b) => a.top - b.top);
        leftLines.forEach((line) => line.items.sort((a, b) => a.left - b.left));

        // Group right column items into lines
        const rightLines: { top: number; items: typeof rightItems }[] = [];
        rightItems.forEach((item) => {
          const foundLine = rightLines.find(
            (line) => Math.abs(line.top - item.top) < 6,
          );
          if (foundLine) {
            foundLine.items.push(item);
          } else {
            rightLines.push({ top: item.top, items: [item] });
          }
        });
        rightLines.sort((a, b) => a.top - b.top);
        rightLines.forEach((line) =>
          line.items.sort((a, b) => a.left - b.left),
        );

        // Helper function to merge text elements on the same line and resolve pdf kerning word-splitting bugs
        const mergeLineItems = (items: typeof positionedItems) => {
          if (items.length === 0) return '';
          let merged = items[0].text;
          for (let i = 1; i < items.length; i++) {
            const prev = items[i - 1];
            const curr = items[i];
            const gap = curr.left - (prev.left + prev.width);

            // If the visual horizontal gap is larger than 4px, join with space.
            // Otherwise, merge characters directly to heal split words.
            if (gap > 4) {
              merged += ' ' + curr.text;
            } else {
              merged += curr.text;
            }
          }
          return merged;
        };

        // Build Left Column HTML (White text, dark background)
        let leftHtml = '';
        leftLines.forEach((line) => {
          const mergedText = mergeLineItems(line.items);
          if (!mergedText) return;

          const firstItem = line.items[0];
          const isBold =
            firstItem.fontWeight === 'bold' ||
            parseInt(firstItem.fontWeight) >= 600;
          const fontSizePx = parseFloat(firstItem.fontSize);

          if (fontSizePx >= 18) {
            leftHtml += `<h1 style="font-size: 18pt; font-weight: bold; color: #ffffff; margin-bottom: 8pt; margin-top: 10pt; font-family: Arial;">${mergedText}</h1>\n`;
          } else if (
            isBold &&
            (fontSizePx >= 13 ||
              (mergedText.length < 30 && !mergedText.endsWith('.')))
          ) {
            leftHtml += `<h2 style="font-size: 12pt; font-weight: bold; color: #ffffff; border-bottom: 1px solid #ffffff; margin-top: 16pt; margin-bottom: 8pt; padding-bottom: 2pt; font-family: Arial; text-transform: uppercase;">${mergedText}</h2>\n`;
          } else {
            leftHtml += `<p style="font-size: 9.5pt; color: #eeeeee; line-height: 1.35; margin-bottom: 6pt; font-family: Arial;">${mergedText}</p>\n`;
          }
        });

        // Build Right Column HTML (Dark text, white background)
        let rightHtml = '';
        rightLines.forEach((line) => {
          const mergedText = mergeLineItems(line.items);
          if (!mergedText) return;

          const firstItem = line.items[0];
          const isBold =
            firstItem.fontWeight === 'bold' ||
            parseInt(firstItem.fontWeight) >= 600;
          const fontSizePx = parseFloat(firstItem.fontSize);

          if (
            isBold &&
            (fontSizePx >= 13 ||
              (mergedText.length < 50 && !mergedText.endsWith('.')))
          ) {
            rightHtml += `<h2 style="font-size: 13pt; font-weight: bold; color: #2b0f54; border-bottom: 1px solid #e2e8f0; margin-top: 16pt; margin-bottom: 8pt; padding-bottom: 2pt; font-family: Arial; text-transform: uppercase;">${mergedText}</h2>\n`;
          } else if (
            mergedText.startsWith('•') ||
            mergedText.startsWith('-') ||
            mergedText.startsWith('*')
          ) {
            const cleanLi = mergedText.replace(/^[•\-\*]\s*/, '');
            rightHtml += `<ul style="margin-bottom: 4pt; padding-left: 20pt; font-family: Arial;"><li style="font-size: 11pt; line-height: 1.35; color: #333333;">${cleanLi}</li></ul>\n`;
          } else {
            rightHtml += `<p style="font-size: 11pt; line-height: 1.35; margin-bottom: 6pt; color: #333333; font-family: Arial;">${mergedText}</p>\n`;
          }
        });

        // Assemble columns inside a full-height Word table (Wider sidebar layout: 35% / 65%)
        return `
          <table style="width: 100%; border: none; border-collapse: collapse;">
            <tr>
              <td width="35%" style="background-color: #2b0f54; color: #ffffff; padding: 36pt 18pt; vertical-align: top;">
                ${leftHtml}
              </td>
              <td width="65%" style="background-color: #ffffff; color: #333333; padding: 36pt 24pt; vertical-align: top;">
                ${rightHtml}
              </td>
            </tr>
          </table>
        `;
      });
    } catch (err) {
      console.error(
        '[Premium DOCX Gen] Puppeteer preprocessing failed, falling back to regex clean:',
        err,
      );
      let fallback = htmlContent || '';
      fallback = fallback.replace(/<img[^>]+src="data:image\/[^>]+>/gi, '');
      fallback = fallback.replace(
        /<img[^>]+alt="background image"[^>]*>/gi,
        '',
      );
      fallback = fallback.replace(/position:\s*(absolute|relative);?/gi, '');
      fallback = fallback.replace(/top:\s*\d+(px|pt|em|%)?;?/gi, '');
      fallback = fallback.replace(/left:\s*\d+(px|pt|em|%)?;?/gi, '');
      fallback = fallback.replace(/white-space:\s*nowrap;?/gi, '');
      cleanSemanticHtml = fallback;
    } finally {
      await browser.close();
    }

    const styledHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
          }
        </style>
      </head>
      <body>
        ${cleanSemanticHtml}
      </body>
      </html>
    `;

    const docxBuffer = await htmlToDocx(styledHtml, null, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });
    return Buffer.from(docxBuffer);
  }

  async updateResumeFile(
    id: string,
    file?: Express.Multer.File,
    resumeText?: string,
  ): Promise<any> {
    let candidate: any = null;

    if (id.startsWith('user-')) {
      const userId = id.replace('user-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      // Check if a Candidate record already exists for this email
      candidate = await this.prisma.candidate.findUnique({
        where: { email: user.email },
      });

      if (!candidate) {
        const parts = user.name.trim().split(/\s+/);
        const firstName = parts[0] || 'Candidate';
        const lastName = parts.slice(1).join(' ') || '';

        candidate = await this.prisma.candidate.create({
          data: {
            firstName,
            lastName,
            email: user.email,
            yearsOfExperience: 0,
            noticePeriod: 0,
            resume: '',
            userId: user.id,
            isPublic: false,
          },
        });
      }
    } else {
      candidate = await this.prisma.candidate.findUnique({
        where: { id },
      });
    }

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    if (!file && !resumeText) {
      throw new Error('Either file or resumeText must be provided.');
    }

    let resumeFilename = candidate.resume;
    let extractedText = resumeText || '';

    if (file) {
      const allowedExtensions = ['.pdf', '.doc', '.docx'];
      const fileExtension = extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExtension)) {
        throw new Error(
          'Invalid file type. Only PDF and Word documents are allowed.',
        );
      }

      const resumeKey = `${Date.now()}-${file.originalname}`;

      // Upload to R2/S3
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: resumeKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });
      await client.send(uploadCommand);

      // Delete old resume file if it exists
      if (candidate.resume) {
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: process.env.S3_BUCKET!,
            Key: candidate.resume,
          });
          await client.send(deleteCommand);
        } catch (err) {
          console.error(
            `Error deleting old resume from R2/S3: ${candidate.resume}`,
            err,
          );
        }

        const oldFilePath = join(process.cwd(), 'uploads', candidate.resume);
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (err) {
          console.error(
            `Error deleting old local resume file: ${candidate.resume}`,
            err,
          );
        }
      }

      resumeFilename = resumeKey;

      // Extract text synchronously if not provided
      if (!resumeText) {
        const tempFilePath = join(process.cwd(), 'uploads', resumeKey);
        try {
          const dir = join(process.cwd(), 'uploads');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(tempFilePath, file.buffer);

          if (fileExtension === '.pdf') {
            const outputDir = join(process.cwd(), 'uploads');
            const htmlFileName = resumeKey.replace(/\.pdf$/i, '.html');
            const htmlFilePath = join(outputDir, htmlFileName);

            try {
              const command = `pdftohtml -s -noframes -c -dataurls "${tempFilePath}" "${htmlFilePath}"`;
              execSync(command);

              if (fs.existsSync(htmlFilePath)) {
                const rawHtml = fs.readFileSync(htmlFilePath, 'utf8');
                extractedText = cleanPdftohtmlOutline(rawHtml);
                fs.unlinkSync(htmlFilePath);
                console.log(
                  `[Sync Extract] pdftohtml conversion succeeded for candidate ID: ${id}`,
                );
              }
            } catch (execError) {
              console.error(
                '[Sync Extract] pdftohtml conversion failed:',
                execError.message,
              );
            }
          } else if (fileExtension === '.docx' || fileExtension === '.doc') {
            const outputDir = join(process.cwd(), 'uploads');
            const htmlFileName = resumeKey.replace(
              /\.(docx|doc)$/i,
              '.html',
            );
            const htmlFilePath = join(outputDir, htmlFileName);

            try {
              const command = `libreoffice --headless --convert-to html --outdir "${outputDir}" "${tempFilePath}"`;
              execSync(command);

              if (fs.existsSync(htmlFilePath)) {
                extractedText = fs.readFileSync(htmlFilePath, 'utf8');
                fs.unlinkSync(htmlFilePath);
                console.log(
                  `[Sync Extract] LibreOffice Word-to-HTML conversion succeeded for candidate ID: ${id}`,
                );
              }
            } catch (libreOfficeError) {
              console.warn(
                '[Sync Extract] LibreOffice conversion failed, falling back to Mammoth:',
                libreOfficeError.message,
              );
              try {
                const result = await mammoth.convertToHtml({ buffer: file.buffer });
                extractedText = result.value || '';
              } catch (mammothError) {
                console.error(
                  '[Sync Extract] Fallback Mammoth DOCX conversion failed:',
                  mammothError,
                );
              }
            }
          }
        } catch (err) {
          console.error('Error extracting text during resume update:', err);
        } finally {
          try {
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          } catch (err) { }
        }
      }
    } else if (resumeText) {
      try {
        const pdfFileName = `resume-${candidate.id}-${Date.now()}.pdf`;
        const finalPdfPath = join(process.cwd(), 'uploads', pdfFileName);

        // Generate high-quality PDF using our Puppeteer function
        const pdfBuffer = await this.generatePdfFromHtml(resumeText);
        fs.writeFileSync(finalPdfPath, pdfBuffer);

        // Upload to S3/R2
        const uploadCommand = new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: pdfFileName,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
        });
        await client.send(uploadCommand);

        // Delete old resume file if it exists
        if (candidate.resume) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET!,
              Key: candidate.resume,
            });
            await client.send(deleteCommand);
          } catch (err) {
            console.error(
              `Error deleting old resume from R2/S3: ${candidate.resume}`,
              err,
            );
          }

          const oldFilePath = join(process.cwd(), 'uploads', candidate.resume);
          try {
            if (fs.existsSync(oldFilePath)) {
              fs.unlinkSync(oldFilePath);
            }
          } catch (err) { }
        }

        resumeFilename = pdfFileName;

        // Clean up the local temp PDF
        try {
          if (fs.existsSync(finalPdfPath)) {
            fs.unlinkSync(finalPdfPath);
          }
        } catch (err) { }

        console.log(
          `[Backend PDF Gen] Puppeteer PDF generated and uploaded to R2/S3 successfully for candidate ID: ${candidate.id}`,
        );
      } catch (err) {
        console.error('Error generating PDF from resumeText on server:', err);
      }
    }

    // Update candidate's resume filename and text in the database
    const updateData: any = {};
    if (file) {
      updateData.resume = resumeFilename;
      updateData.resumeText = extractedText;
      updateData.editedHtml = null; // Reset editedHtml because they uploaded a new resume
    } else {
      updateData.resume = resumeFilename;
      updateData.editedHtml = resumeText; // Store edited HTML in editedHtml field
      // Do not touch resumeText (keep original parsed HTML)
    }

    const updatedCandidate = await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: updateData,
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
    });

    return this.mapCandidate(updatedCandidate);
  }

  async applyToJob(candidateId: string, jobId: string) {
    const existing = await this.prisma.appliedJob.findUnique({
      where: {
        candidateId_jobId: { candidateId, jobId },
      },
    });
    if (existing) {
      return {
        message: 'Already applied to this job',
        statusCode: 200,
        data: existing,
      };
    }
    const applied = await this.prisma.appliedJob.create({
      data: {
        candidateId,
        jobId,
        status: 'APPLIED',
      },
      include: {
        job: true,
      },
    });
    return {
      message: 'Successfully applied to the job',
      statusCode: 201,
      data: applied,
    };
  }

  // ── Apply via logged-in user (resolves candidate from user email in JWT) ───
  async applyToJobByEmail(email: string, jobId: string, userId?: string) {
    let targetEmail: string | undefined = email;
    if (!targetEmail && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      targetEmail = user?.email;
    }

    if (!targetEmail) {
      throw new BadRequestException('Candidate email is required to apply');
    }

    const emailLower = targetEmail.trim().toLowerCase();
    const candidate = await this.prisma.candidate.findUnique({
      where: { email: emailLower },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!candidate) {
      throw new NotFoundException(
        'No candidate profile found. Please upload your resume first.',
      );
    }
    return this.applyToJob(candidate.id, jobId);
  }

  async updateCandidate(id: string, data: any) {
    const {
      firstName,
      lastName,
      email,
      mobile,
      yearsOfExperience,
      education,
      noticePeriod,
      currentLocation,
      preferredWorkMode,
      budget,
      preferredJobLocations,
      expectedCtc,
      currentCtc,
      skills,
      adminNotes,
    } = data;

    let targetId = id;
    if (id.startsWith('user-')) {
      const userId = id.replace('user-', '');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      let existingCandidate = await this.prisma.candidate.findFirst({
        where: { userId },
      });

      if (!existingCandidate) {
        // Create candidate record dynamically
        existingCandidate = await this.prisma.candidate.create({
          data: {
            firstName: firstName !== undefined ? firstName : user.name.split(' ')[0] || '',
            lastName: lastName !== undefined ? lastName : user.name.split(' ').slice(1).join(' ') || '',
            email: email !== undefined ? email.trim().toLowerCase() : user.email,
            mobile: mobile || null,
            yearsOfExperience: yearsOfExperience !== undefined ? parseFloat(yearsOfExperience) : 0,
            education: education || null,
            noticePeriod: noticePeriod !== undefined ? parseInt(noticePeriod, 10) : 0,
            currentLocation: currentLocation || null,
            preferredWorkMode: preferredWorkMode || null,
            budget: budget || null,
            preferredJobLocations: Array.isArray(preferredJobLocations) ? preferredJobLocations : [],
            expectedCtc: expectedCtc !== undefined && expectedCtc !== null && expectedCtc !== "" ? parseFloat(expectedCtc) : null,
            currentCtc: currentCtc !== undefined && currentCtc !== null && currentCtc !== "" ? parseFloat(currentCtc) : null,
            resume: '',
            userId: user.id,
            adminNotes: adminNotes || null,
          },
        });
      }
      targetId = existingCandidate.id;
    } else {
      const existing = await this.prisma.candidate.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new NotFoundException(`Candidate not found`);
      }
    }

    let skillsUpdate = {};
    if (skills !== undefined && Array.isArray(skills)) {
      await this.prisma.candidateSkill.deleteMany({
        where: { candidateId: targetId },
      });
      skillsUpdate = {
        skills: {
          create: skills.map((name: string) => ({
            skill: {
              connectOrCreate: {
                where: { name: name.trim() },
                create: { name: name.trim() },
              },
            },
          })),
        },
      };
    }

    const updated = await this.prisma.candidate.update({
      where: { id: targetId },
      data: {
        firstName: firstName !== undefined ? firstName : undefined,
        lastName: lastName !== undefined ? lastName : undefined,
        email: email !== undefined ? email.trim().toLowerCase() : undefined,
        mobile: mobile !== undefined ? mobile : undefined,
        yearsOfExperience: yearsOfExperience !== undefined ? parseFloat(yearsOfExperience) : undefined,
        education: education !== undefined ? education : undefined,
        noticePeriod: noticePeriod !== undefined ? parseInt(noticePeriod, 10) : undefined,
        currentLocation: currentLocation !== undefined ? currentLocation : undefined,
        preferredWorkMode: preferredWorkMode !== undefined ? preferredWorkMode : undefined,
        budget: budget !== undefined ? budget : undefined,
        preferredJobLocations: Array.isArray(preferredJobLocations) ? preferredJobLocations : undefined,
        expectedCtc: expectedCtc !== undefined ? (expectedCtc !== null && expectedCtc !== "" ? parseFloat(expectedCtc) : null) : undefined,
        currentCtc: currentCtc !== undefined ? (currentCtc !== null && currentCtc !== "" ? parseFloat(currentCtc) : null) : undefined,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
        ...skillsUpdate,
      },
      include: {
        skills: { include: { skill: true } },
        appliedJobs: { include: { job: true } },
      },
    });

    return this.mapCandidate(updated);
  }
}

function cleanPdftohtmlOutline(html: string): string {
  if (!html) return html;
  // Strip <hr/> and the Document Outline section
  let cleaned = html.replace(
    /<hr\s*\/?>\s*<a\s+name="outline">[\s\S]*?(<\/body>|<\/html>|$)/i,
    '$1',
  );
  cleaned = cleaned.replace(
    /<a\s+name="outline">[\s\S]*?(<\/body>|<\/html>|$)/i,
    '$1',
  );
  cleaned = cleaned.replace(
    /<h1>Document Outline<\/h1>[\s\S]*?(<\/body>|<\/html>|$)/i,
    '$1',
  );
  return cleaned;
}
