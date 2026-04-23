import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardingDto } from './dto/onboarding.dto';
import { JobCategory } from '@prisma/client';

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  async completeOnboarding(userId: string, dto: OnboardingDto) {
    await this.prisma.jobProfile.upsert({
      where: { userId },
      update: {
        title: dto.jobTitle,
        jobCategory: dto.jobCategory,
        physicalDemandLevel: dto.physicalDemandLevel,
        shiftType: dto.shiftType,
        primaryRisks: dto.primaryRisks || [],
        yearsInRole: dto.yearsInRole,
        hoursPerDay: dto.hoursPerDay,
      },
      create: {
        userId,
        title: dto.jobTitle,
        jobCategory: dto.jobCategory,
        physicalDemandLevel: dto.physicalDemandLevel,
        shiftType: dto.shiftType,
        primaryRisks: dto.primaryRisks || [],
        yearsInRole: dto.yearsInRole,
        hoursPerDay: dto.hoursPerDay,
      },
    });

    if (dto.departmentId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { departmentId: dto.departmentId },
      });
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnboarded: true },
    });

    // Auto-assign a starter program based on job category
    await this.assignStarterProgram(userId, dto.jobCategory);

    return { message: 'Onboarding completed successfully' };
  }

  private async assignStarterProgram(userId: string, jobCategory: JobCategory) {
    const program = await this.prisma.program.findFirst({
      where: { jobCategory, isTemplate: true, isActive: true },
    });

    if (program) {
      const existing = await this.prisma.workerProgram.findFirst({
        where: { userId, programId: program.id, status: 'ACTIVE' },
      });

      if (!existing) {
        await this.prisma.workerProgram.create({
          data: { userId, programId: program.id },
        });
      }
    }
  }

  async getWorkerStats(userId: string) {
    const [checkinCount, currentStreak, programs] = await Promise.all([
      this.prisma.dailyCheckin.count({ where: { userId } }),
      this.calculateStreak(userId),
      this.prisma.workerProgram.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          program: {
            select: { id: true, name: true, goal: true, durationWeeks: true },
          },
          sessionLogs: { orderBy: { date: 'desc' }, take: 1 },
        },
      }),
    ]);

    return { checkinCount, currentStreak, activePrograms: programs };
  }

  private async calculateStreak(userId: string): Promise<number> {
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
      take: 365,
    });

    if (!checkins.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkins.length; i++) {
      const checkinDate = new Date(checkins[i].date);
      checkinDate.setHours(0, 0, 0, 0);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (checkinDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
