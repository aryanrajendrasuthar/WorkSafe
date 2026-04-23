import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const PROTECTED_EMAIL = 'aryanrajendrasuthar@gmail.com';

@Injectable()
export class HrService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ── Departments ──────────────────────────────────────────────────────────────

  async getDepartments(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      include: {
        _count: { select: { users: { where: { role: 'WORKER', isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(organizationId: string, name: string, description?: string, location?: string) {
    return this.prisma.department.create({
      data: { organizationId, name, description, location },
    });
  }

  async updateDepartment(id: string, organizationId: string, name: string, description?: string, location?: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, organizationId } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.prisma.department.update({ where: { id }, data: { name, description, location } });
  }

  async deleteDepartment(id: string, organizationId: string) {
    const dept = await this.prisma.department.findFirst({ where: { id, organizationId } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.prisma.department.delete({ where: { id } });
  }

  // ── Users / Roster ───────────────────────────────────────────────────────────

  async getUsers(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isOnboarded: true,
        createdAt: true,
        lastLoginAt: true,
        department: { select: { id: true, name: true } },
        jobProfile: { select: { title: true } },
        _count: { select: { checkIns: true } },
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });
  }

  async updateUserRole(id: string, organizationId: string, role: string) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email.toLowerCase() === PROTECTED_EMAIL) {
      throw new ForbiddenException('The primary administrator account cannot be modified.');
    }
    return this.prisma.user.update({ where: { id }, data: { role: role as any } });
  }

  async updateUserDepartment(id: string, organizationId: string, departmentId: string | null) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({ where: { id }, data: { departmentId } });
  }

  async setUserActive(id: string, organizationId: string, isActive: boolean) {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.email.toLowerCase() === PROTECTED_EMAIL) {
      throw new ForbiddenException('The primary administrator account cannot be modified.');
    }
    return this.prisma.user.update({ where: { id }, data: { isActive } });
  }

  // ── Invites ──────────────────────────────────────────────────────────────────

  async getInvites(organizationId: string) {
    return this.prisma.inviteToken.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteInvite(id: string, organizationId: string) {
    const invite = await this.prisma.inviteToken.findFirst({ where: { id, organizationId } });
    if (!invite) throw new NotFoundException('Invite not found');
    return this.prisma.inviteToken.delete({ where: { id } });
  }

  // ── Org Stats ────────────────────────────────────────────────────────────────

  async getOrgStats(organizationId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalWorkers, totalDepartments, totalInvites, activeWorkers, org] = await Promise.all([
      this.prisma.user.count({ where: { organizationId, role: 'WORKER', isActive: true } }),
      this.prisma.department.count({ where: { organizationId } }),
      this.prisma.inviteToken.count({ where: { organizationId, usedAt: null, expiresAt: { gt: new Date() } } }),
      this.prisma.user.count({
        where: {
          organizationId,
          role: 'WORKER',
          isActive: true,
          checkIns: { some: { date: { gte: thirtyDaysAgo } } },
        },
      }),
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, industry: true, subscriptionTier: true, maxWorkers: true },
      }),
    ]);

    return {
      totalWorkers,
      totalDepartments,
      totalInvites,
      activeWorkers,
      orgName: org?.name,
      orgId: org?.id,
      industry: org?.industry,
      subscriptionTier: org?.subscriptionTier,
      maxWorkers: org?.maxWorkers,
    };
  }

  async updateOrg(organizationId: string, data: { name?: string; industry?: string }) {
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { ...(data.name && { name: data.name }), ...(data.industry !== undefined && { industry: data.industry }) },
      select: { id: true, name: true, industry: true, subscriptionTier: true },
    });
  }

  // ── Audit Logs ───────────────────────────────────────────────────────────────

  async getAuditLogs(organizationId: string, limit = 100) {
    return this.prisma.auditLog.findMany({
      where: { organizationId },
      include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
