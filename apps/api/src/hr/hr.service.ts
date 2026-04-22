import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

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
    const [totalUsers, departments, invites, org] = await Promise.all([
      this.prisma.user.count({ where: { organizationId, isActive: true } }),
      this.prisma.department.count({ where: { organizationId } }),
      this.prisma.inviteToken.count({ where: { organizationId, usedAt: null } }),
      this.prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true, subscriptionTier: true, maxWorkers: true } }),
    ]);

    return { totalUsers, departments, pendingInvites: invites, org };
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
