import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TherapistService {
  constructor(private prisma: PrismaService) {}

  async getWorkers(organizationId: string) {
    const workers = await this.prisma.user.findMany({
      where: { organizationId, role: 'WORKER', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        departmentId: true,
        isOnboarded: true,
        department: { select: { name: true } },
        jobProfile: { select: { title: true, physicalDemandLevel: true } },
        checkIns: {
          orderBy: { date: 'desc' },
          take: 14,
          include: { bodyAreas: true },
        },
        workerPrograms: {
          where: { status: 'ACTIVE' },
          select: { id: true, program: { select: { name: true } } },
        },
      },
    });

    return workers.map((w) => {
      const recentCheckins = w.checkIns;
      const lastCheckin = recentCheckins[0] ?? null;
      const riskScore = this.computeWorkerRisk(recentCheckins);
      const trend = this.computeTrend(recentCheckins);

      const predictedToEscalate = trend === 'up' && riskScore >= 30;

      return {
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        email: w.email,
        avatarUrl: w.avatarUrl,
        department: w.department?.name ?? null,
        jobTitle: w.jobProfile?.title ?? null,
        isOnboarded: w.isOnboarded,
        riskScore,
        riskLevel: this.riskLevel(riskScore),
        trend,
        predictedToEscalate,
        lastCheckinDate: lastCheckin?.date ?? null,
        lastOverallStatus: lastCheckin?.overallStatus ?? null,
        checkinCount: recentCheckins.length,
        activePrograms: w.workerPrograms.map((wp) => wp.program.name),
      };
    });
  }

  async getWorkerDetail(workerId: string, organizationId: string) {
    const worker = await this.prisma.user.findFirst({
      where: { id: workerId, organizationId, role: 'WORKER' },
      include: {
        department: true,
        jobProfile: true,
        checkIns: {
          orderBy: { date: 'desc' },
          take: 60,
          include: { bodyAreas: true },
        },
        workerPrograms: {
          where: { status: 'ACTIVE' },
          include: {
            program: {
              include: {
                programExercises: {
                  include: { exercise: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
            sessionLogs: { orderBy: { date: 'desc' }, take: 5 },
          },
        },
      },
    });

    if (!worker) return null;

    // Pain trend by body area (last 30 days)
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const recentEntries = worker.checkIns
      .filter((c) => new Date(c.date) >= since30)
      .flatMap((c) => c.bodyAreas.map((a) => ({ date: c.date, ...a })));

    // Group by date → body part → avg intensity
    const trendMap: Record<string, Record<string, number[]>> = {};
    for (const e of recentEntries) {
      const d = new Date(e.date).toISOString().split('T')[0];
      if (!trendMap[d]) trendMap[d] = {};
      if (!trendMap[d][e.bodyPart]) trendMap[d][e.bodyPart] = [];
      trendMap[d][e.bodyPart].push(e.intensity);
    }
    const painTrend = Object.entries(trendMap).map(([date, parts]) => ({
      date,
      ...Object.fromEntries(
        Object.entries(parts).map(([p, vals]) => [
          p,
          Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
        ]),
      ),
    }));

    const riskScore = this.computeWorkerRisk(worker.checkIns);

    return {
      ...worker,
      riskScore,
      riskLevel: this.riskLevel(riskScore),
      painTrend,
      checkIns: worker.checkIns.slice(0, 30),
    };
  }

  async getEscalations(organizationId: string) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const workers = await this.prisma.user.findMany({
      where: { organizationId, role: 'WORKER', isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        department: { select: { name: true } },
        checkIns: {
          where: { date: { gte: sevenDaysAgo } },
          include: { bodyAreas: true },
          orderBy: { date: 'asc' },
        },
      },
    });

    const escalations: {
      workerId: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
      department: string | null;
      delta: number;
      latestIntensity: number;
      checkinCount: number;
    }[] = [];
    for (const w of workers) {
      if (w.checkIns.length < 3) continue;

      // Compare first half vs second half average intensity
      const half = Math.floor(w.checkIns.length / 2);
      const firstHalf = w.checkIns.slice(0, half);
      const secondHalf = w.checkIns.slice(half);

      const avg = (checkins: typeof w.checkIns) => {
        const all = checkins.flatMap((c) =>
          c.bodyAreas.map((a) => a.intensity),
        );
        return all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
      };

      const delta = avg(secondHalf) - avg(firstHalf);
      if (delta >= 1.5) {
        escalations.push({
          workerId: w.id,
          firstName: w.firstName,
          lastName: w.lastName,
          avatarUrl: w.avatarUrl,
          department: w.department?.name ?? null,
          delta: Math.round(delta * 10) / 10,
          latestIntensity: Math.round(avg(secondHalf) * 10) / 10,
          checkinCount: w.checkIns.length,
        });
      }
    }

    return escalations.sort((a, b) => b.delta - a.delta);
  }

  private computeWorkerRisk(checkins: any[]): number {
    if (!checkins.length) return 0;
    const recent = checkins.slice(0, 7);
    const allIntensities = recent.flatMap((c: any) =>
      (c.bodyAreas ?? []).map((a: any) => a.intensity),
    );
    if (!allIntensities.length) return 5;
    const avg =
      allIntensities.reduce((a: number, b: number) => a + b, 0) /
      allIntensities.length;
    return Math.min(100, Math.round(avg * 10));
  }

  private computeTrend(checkins: any[]): 'up' | 'down' | 'stable' {
    if (checkins.length < 4) return 'stable';
    const half = Math.floor(checkins.length / 2);
    const avg = (arr: any[]) => {
      const vals = arr.flatMap((c) =>
        (c.bodyAreas ?? []).map((a: any) => a.intensity),
      );
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const delta = avg(checkins.slice(0, half)) - avg(checkins.slice(half));
    if (delta > 0.5) return 'up';
    if (delta < -0.5) return 'down';
    return 'stable';
  }

  private riskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }
}
