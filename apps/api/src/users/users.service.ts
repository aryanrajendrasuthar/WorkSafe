import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        organizationId: true,
        departmentId: true,
        avatarUrl: true,
        isOnboarded: true,
        isActive: true,
        isMfaEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        jobProfile: true,
        department: { select: { id: true, name: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByOrg(organizationId: string, role?: Role) {
    return this.prisma.user.findMany({
      where: { organizationId, ...(role ? { role } : {}), isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        departmentId: true,
        avatarUrl: true,
        isOnboarded: true,
        department: { select: { id: true, name: true } },
        jobProfile: {
          select: { title: true, jobCategory: true, physicalDemandLevel: true },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      departmentId?: string;
    },
  ) {
    return this.prisma.user.update({ where: { id }, data });
  }

  async deactivateUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
