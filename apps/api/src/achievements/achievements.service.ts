import { Injectable } from '@nestjs/common';
import { AchievementType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const ACHIEVEMENT_META: Record<
  AchievementType,
  { title: string; description: string; icon: string }
> = {
  FIRST_CHECKIN: {
    title: 'First Step',
    description: 'Completed your first daily check-in',
    icon: '🌟',
  },
  STREAK_7: {
    title: 'Week Warrior',
    description: '7-day check-in streak',
    icon: '🔥',
  },
  STREAK_30: {
    title: 'Monthly Momentum',
    description: '30-day check-in streak',
    icon: '🏅',
  },
  STREAK_100: {
    title: 'Century Club',
    description: '100-day check-in streak',
    icon: '💯',
  },
  FIRST_SESSION: {
    title: 'In Motion',
    description: 'Completed your first exercise session',
    icon: '💪',
  },
  SESSIONS_10: {
    title: 'Getting Strong',
    description: 'Completed 10 exercise sessions',
    icon: '⚡',
  },
  SESSIONS_50: {
    title: 'Committed',
    description: 'Completed 50 exercise sessions',
    icon: '🎯',
  },
  FIRST_PROGRAM_COMPLETE: {
    title: 'Program Graduate',
    description: 'Completed all sessions in an assigned program',
    icon: '🏆',
  },
  PAIN_FREE_30: {
    title: 'Resilient',
    description: '30 consecutive check-ins with no severe pain reported',
    icon: '🛡️',
  },
};

@Injectable()
export class AchievementsService {
  constructor(private prisma: PrismaService) {}

  async getUserAchievements(userId: string) {
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'asc' },
    });

    const unlockedSet = new Set(unlocked.map((a) => a.achievement));

    const all = (Object.keys(ACHIEVEMENT_META) as AchievementType[]).map(
      (type) => ({
        type,
        ...ACHIEVEMENT_META[type],
        unlocked: unlockedSet.has(type),
        unlockedAt:
          unlocked.find((a) => a.achievement === type)?.unlockedAt ?? null,
      }),
    );

    return { achievements: all, unlockedCount: unlocked.length };
  }

  async checkAndUnlock(userId: string): Promise<AchievementType[]> {
    const [checkinCount, streak, sessions, unlocked] = await Promise.all([
      this.prisma.dailyCheckin.count({ where: { userId } }),
      this.calculateStreak(userId),
      this.prisma.sessionLog.count({
        where: { workerProgram: { userId } },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievement: true },
      }),
    ]);

    const alreadyUnlocked = new Set(unlocked.map((a) => a.achievement));
    const toUnlock: AchievementType[] = [];

    const candidate = (type: AchievementType, condition: boolean) => {
      if (condition && !alreadyUnlocked.has(type)) toUnlock.push(type);
    };

    candidate('FIRST_CHECKIN', checkinCount >= 1);
    candidate('STREAK_7', streak >= 7);
    candidate('STREAK_30', streak >= 30);
    candidate('STREAK_100', streak >= 100);
    candidate('FIRST_SESSION', sessions >= 1);
    candidate('SESSIONS_10', sessions >= 10);
    candidate('SESSIONS_50', sessions >= 50);

    // FIRST_PROGRAM_COMPLETE — any worker program with ≥ (durationWeeks * 3) sessions
    if (!alreadyUnlocked.has('FIRST_PROGRAM_COMPLETE')) {
      const programs = await this.prisma.workerProgram.findMany({
        where: { userId },
        include: {
          program: { select: { durationWeeks: true } },
          _count: { select: { sessionLogs: true } },
        },
      });
      const completed = programs.some(
        (wp) => wp._count.sessionLogs >= wp.program.durationWeeks * 3,
      );
      if (completed) toUnlock.push('FIRST_PROGRAM_COMPLETE');
    }

    // PAIN_FREE_30 — last 30 checkins with no SEVERE overallStatus
    if (!alreadyUnlocked.has('PAIN_FREE_30') && checkinCount >= 30) {
      const recent = await this.prisma.dailyCheckin.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30,
        select: { overallStatus: true },
      });
      if (
        recent.length === 30 &&
        recent.every((c) => c.overallStatus !== 'SEVERE')
      ) {
        toUnlock.push('PAIN_FREE_30');
      }
    }

    if (toUnlock.length > 0) {
      await this.prisma.userAchievement.createMany({
        data: toUnlock.map((achievement) => ({ userId, achievement })),
        skipDuplicates: true,
      });

      // Fire in-app notifications for newly unlocked achievements
      await this.prisma.notification.createMany({
        data: toUnlock.map((type) => ({
          userId,
          type: 'ACHIEVEMENT_UNLOCKED' as const,
          title: `Achievement unlocked: ${ACHIEVEMENT_META[type].title}`,
          message: ACHIEVEMENT_META[type].description,
          data: { achievementType: type, icon: ACHIEVEMENT_META[type].icon },
        })),
      });
    }

    return toUnlock;
  }

  private async calculateStreak(userId: string): Promise<number> {
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
      take: 365,
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
      if (checkinDate.getTime() === expected.getTime()) streak++;
      else break;
    }

    return streak;
  }
}
