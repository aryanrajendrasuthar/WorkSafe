import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RiskService {
  constructor(private prisma: PrismaService) {}

  async getOrgSummary(organizationId: string) {
    const since90 = new Date();
    since90.setDate(since90.getDate() - 90);
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);

    const [workers, departments, incidents, alerts] = await Promise.all([
      this.prisma.user.findMany({
        where: { organizationId, role: 'WORKER', isActive: true },
        include: {
          checkIns: {
            where: { date: { gte: since30 } },
            include: { bodyAreas: true },
            orderBy: { date: 'desc' },
          },
          workerPrograms: { where: { status: 'ACTIVE' }, select: { id: true } },
        },
      }),
      this.prisma.department.findMany({
        where: { organizationId },
        include: {
          users: {
            where: { role: 'WORKER', isActive: true },
            include: {
              checkIns: {
                where: { date: { gte: since30 } },
                include: { bodyAreas: true },
              },
            },
          },
        },
      }),
      this.prisma.incident.findMany({
        where: { organizationId, incidentDate: { gte: since30 } },
        select: { id: true, status: true, severity: true },
      }),
      this.prisma.alert.findMany({
        where: { organizationId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Worker risk scores
    const workerScores = workers.map((w) => {
      const riskScore = this.computeWorkerRisk(w.checkIns);
      return { ...w, riskScore, riskLevel: this.riskLevel(riskScore) };
    });

    const orgRiskScore = workerScores.length
      ? Math.round(workerScores.reduce((s, w) => s + w.riskScore, 0) / workerScores.length)
      : 0;

    const riskDist = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const w of workerScores) riskDist[w.riskLevel]++;

    // Check-in compliance (last 7 days)
    const checkinTotal = workers.reduce((s, w) => s + w.checkIns.filter((c) => new Date(c.date) >= since7).length, 0);
    const maxExpected = workers.length * 7;
    const checkinRate = maxExpected > 0 ? Math.round((checkinTotal / maxExpected) * 100) : 0;

    // Department risk scores
    const deptScores = departments.map((d) => {
      const deptWorkers = d.users;
      if (deptWorkers.length < 1) return { id: d.id, name: d.name, score: 0, workerCount: 0 };
      const scores = deptWorkers.map((w) => this.computeWorkerRisk(w.checkIns));
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      return { id: d.id, name: d.name, score: avg, workerCount: deptWorkers.length };
    });

    // Top body regions (last 30 days)
    const regionCounts: Record<string, number> = {};
    for (const w of workers) {
      for (const ci of w.checkIns) {
        for (const a of ci.bodyAreas) {
          regionCounts[a.bodyPart] = (regionCounts[a.bodyPart] ?? 0) + 1;
        }
      }
    }
    const topRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([region, count]) => ({ region, count }));

    // Org risk trend (last 90 days, weekly buckets)
    const riskTrend = await this.computeOrgRiskTrend(organizationId, since90);

    // Persist current org risk score
    await this.persistRiskScore({
      entityType: 'ORGANIZATION',
      entityId: organizationId,
      organizationId,
      score: orgRiskScore,
      factors: { checkinRate, workerCount: workers.length, deptCount: departments.length },
    });

    return {
      orgRiskScore,
      orgRiskLevel: this.riskLevel(orgRiskScore),
      riskDistribution: riskDist,
      checkinRate,
      totalWorkers: workers.length,
      activeIncidentsThisMonth: incidents.filter((i) => i.status !== 'CLOSED' && i.status !== 'RESOLVED').length,
      totalIncidentsThisMonth: incidents.length,
      activeAlerts: alerts.length,
      deptScores: deptScores.sort((a, b) => b.score - a.score),
      topRegions,
      riskTrend,
      topAtRiskWorkers: workerScores
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 5)
        .map((w) => ({
          id: w.id,
          firstName: w.firstName,
          lastName: w.lastName,
          riskScore: w.riskScore,
          riskLevel: w.riskLevel,
          department: null as string | null,
        })),
    };
  }

  async getDepartmentDetail(departmentId: string, organizationId: string) {
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const since7 = new Date();
    since7.setDate(since7.getDate() - 7);

    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, organizationId },
      include: {
        users: {
          where: { role: 'WORKER', isActive: true },
          include: {
            checkIns: {
              where: { date: { gte: since30 } },
              include: { bodyAreas: true },
              orderBy: { date: 'desc' },
            },
            workerPrograms: { where: { status: 'ACTIVE' }, include: { sessionLogs: { take: 10, orderBy: { date: 'desc' } } } },
          },
        },
      },
    });

    if (!dept) return null;

    const workerScores = dept.users.map((w) => {
      const riskScore = this.computeWorkerRisk(w.checkIns);
      return { id: w.id, firstName: w.firstName, lastName: w.lastName, riskScore, riskLevel: this.riskLevel(riskScore) };
    });

    const deptScore = workerScores.length
      ? Math.round(workerScores.reduce((s, w) => s + w.riskScore, 0) / workerScores.length)
      : 0;

    const riskDist = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const w of workerScores) riskDist[w.riskLevel]++;

    // Body region breakdown
    const regionCounts: Record<string, number> = {};
    for (const w of dept.users) {
      for (const ci of w.checkIns) {
        for (const a of ci.bodyAreas) {
          regionCounts[a.bodyPart] = (regionCounts[a.bodyPart] ?? 0) + 1;
        }
      }
    }
    const topRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([region, count]) => ({ region, count }));

    // Program compliance
    const programCompliance = dept.users.map((w) => {
      const completed = w.workerPrograms.reduce((s, wp) => s + wp.sessionLogs.reduce((a, l) => a + l.exercisesCompleted, 0), 0);
      const total = w.workerPrograms.reduce((s, wp) => s + wp.sessionLogs.reduce((a, l) => a + l.exercisesTotal, 0), 0);
      return total > 0 ? completed / total : null;
    }).filter((v) => v !== null) as number[];

    const avgCompliance = programCompliance.length
      ? Math.round((programCompliance.reduce((a, b) => a + b, 0) / programCompliance.length) * 100)
      : 0;

    return {
      id: dept.id,
      name: dept.name,
      deptScore,
      deptRiskLevel: this.riskLevel(deptScore),
      workerCount: dept.users.length,
      riskDistribution: riskDist,
      topRegions,
      avgCompliance,
      workers: workerScores.sort((a, b) => b.riskScore - a.riskScore),
    };
  }

  async checkAndCreateAlerts(organizationId: string) {
    const summary = await this.getOrgSummary(organizationId);

    const alertsToCreate: { organizationId: string; departmentId?: string; type: string; title: string; message: string; threshold: number; currentValue: number }[] = [];

    // Org risk threshold
    if (summary.orgRiskScore >= 65) {
      alertsToCreate.push({
        organizationId,
        type: 'ORG_RISK_HIGH',
        title: 'Organization Risk Score Elevated',
        message: `Org-wide risk score is ${summary.orgRiskScore}/100, exceeding the 65-point threshold.`,
        threshold: 65,
        currentValue: summary.orgRiskScore,
      });
    }

    // Department thresholds
    for (const dept of summary.deptScores) {
      if (dept.score >= 70) {
        alertsToCreate.push({
          organizationId,
          departmentId: dept.id,
          type: 'DEPT_RISK_HIGH',
          title: `${dept.name} Department Risk High`,
          message: `${dept.name} has a risk score of ${dept.score}/100, exceeding the 70-point threshold.`,
          threshold: 70,
          currentValue: dept.score,
        });
      }
    }

    // Check-in compliance
    if (summary.checkinRate < 50) {
      alertsToCreate.push({
        organizationId,
        type: 'LOW_CHECKIN_COMPLIANCE',
        title: 'Low Check-in Compliance',
        message: `Only ${summary.checkinRate}% of workers checked in this week. Target is 50%.`,
        threshold: 50,
        currentValue: summary.checkinRate,
      });
    }

    // Deduplicate: skip if same org+type active alert exists in last 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existingAlerts = await this.prisma.alert.findMany({
      where: { organizationId, status: 'ACTIVE', createdAt: { gte: since24h } },
      select: { type: true },
    });
    const existingTypes = new Set(existingAlerts.map((a) => a.type));

    const newAlerts = alertsToCreate.filter((a) => !existingTypes.has(a.type));
    if (newAlerts.length > 0) {
      await this.prisma.alert.createMany({ data: newAlerts });
    }

    return { created: newAlerts.length };
  }

  async getAlerts(organizationId: string) {
    return this.prisma.alert.findMany({
      where: { organizationId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async acknowledgeAlert(alertId: string, userId: string, organizationId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { status: 'ACKNOWLEDGED', acknowledgedBy: userId, acknowledgedAt: new Date() },
    });
  }

  async resolveAlert(alertId: string, organizationId: string) {
    return this.prisma.alert.update({
      where: { id: alertId },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
  }

  private async computeOrgRiskTrend(organizationId: string, since: Date) {
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { user: { organizationId }, date: { gte: since } },
      include: { bodyAreas: true },
      orderBy: { date: 'asc' },
    });

    // Group by week
    const weekMap: Record<string, number[]> = {};
    for (const ci of checkins) {
      const d = new Date(ci.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      const intensities = ci.bodyAreas.map((a) => a.intensity);
      if (!weekMap[key]) weekMap[key] = [];
      weekMap[key].push(...intensities);
    }

    return Object.entries(weekMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, vals]) => ({
        week,
        score: vals.length ? Math.min(100, Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10)) : 0,
      }));
  }

  private async persistRiskScore(data: { entityType: string; entityId: string; organizationId: string; score: number; factors: any }) {
    await this.prisma.riskScore.create({
      data: {
        entityType: data.entityType as any,
        entityId: data.entityId,
        organizationId: data.organizationId,
        score: data.score,
        factors: data.factors,
      },
    });
  }

  private computeWorkerRisk(checkins: any[]): number {
    if (!checkins.length) return 0;
    const recent = checkins.slice(0, 7);
    const allIntensities = recent.flatMap((c: any) => (c.bodyAreas ?? []).map((a: any) => a.intensity));
    if (!allIntensities.length) return 5;
    const avg = allIntensities.reduce((a: number, b: number) => a + b, 0) / allIntensities.length;
    return Math.min(100, Math.round(avg * 10));
  }

  private riskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 25) return 'low';
    if (score < 50) return 'medium';
    if (score < 75) return 'high';
    return 'critical';
  }
}
