import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@Injectable()
export class CheckinsService {
  constructor(
    private prisma: PrismaService,
    private achievements: AchievementsService,
  ) {}

  async createCheckin(userId: string, dto: CreateCheckinDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    if (existing) {
      throw new BadRequestException('Check-in already submitted for today');
    }

    const checkin = await this.prisma.dailyCheckin.create({
      data: {
        userId,
        date: today,
        overallStatus: dto.overallStatus,
        workReadiness: dto.workReadiness ?? 'FULL_DUTY',
        note: dto.note,
        bodyAreas: {
          create: dto.bodyAreas.map((area) => ({
            bodyPart: area.bodyPart,
            intensity: area.intensity,
            severity: area.severity ?? 'NONE',
            taskCorrelation: area.taskCorrelation,
            note: area.note,
          })),
        },
      },
      include: { bodyAreas: true },
    });

    const [streak, newAchievements] = await Promise.all([
      this.calculateStreak(userId),
      this.achievements.checkAndUnlock(userId),
    ]);
    return { checkin, streak, newAchievements };
  }

  async getHistory(userId: string, days = 90) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId, date: { gte: since } },
      include: { bodyAreas: true },
      orderBy: { date: 'asc' },
    });

    return checkins;
  }

  async getTodayCheckin(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.prisma.dailyCheckin.findUnique({
      where: { userId_date: { userId, date: today } },
      include: { bodyAreas: true },
    });
  }

  async getPainTrend(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const entries = await this.prisma.bodyAreaEntry.findMany({
      where: { checkin: { userId, date: { gte: since } } },
      include: { checkin: { select: { date: true } } },
      orderBy: { checkin: { date: 'asc' } },
    });

    // Group by date → body part → avg intensity
    const byDate: Record<string, Record<string, number[]>> = {};
    for (const e of entries) {
      const d = e.checkin.date.toISOString().split('T')[0];
      if (!byDate[d]) byDate[d] = {};
      if (!byDate[d][e.bodyPart]) byDate[d][e.bodyPart] = [];
      byDate[d][e.bodyPart].push(e.intensity);
    }

    return Object.entries(byDate).map(([date, parts]) => ({
      date,
      ...Object.fromEntries(
        Object.entries(parts).map(([part, vals]) => [
          part,
          Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        ]),
      ),
    }));
  }

  async calculateStreak(userId: string): Promise<number> {
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    if (!checkins.length) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < checkins.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      const checkinDate = new Date(checkins[i].date);
      checkinDate.setHours(0, 0, 0, 0);

      if (checkinDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
