import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

@Injectable()
export class IncidentsService {
  constructor(private prisma: PrismaService) {}

  async create(reportedById: string, organizationId: string, dto: CreateIncidentDto) {
    const worker = await this.prisma.user.findFirst({
      where: { id: dto.workerId, organizationId },
    });
    if (!worker) throw new NotFoundException('Worker not found');

    return this.prisma.incident.create({
      data: {
        userId: dto.workerId,
        organizationId,
        reportedById,
        bodyPart: dto.bodyPart,
        injuryType: dto.injuryType,
        severity: dto.severity ?? 'MODERATE',
        incidentDate: new Date(dto.incidentDate),
        taskAtTime: dto.taskAtTime,
        description: dto.description,
        isOshaRecordable: dto.isOshaRecordable ?? false,
      },
      include: { worker: { select: { firstName: true, lastName: true } } },
    });
  }

  async findAll(organizationId: string, workerId?: string) {
    return this.prisma.incident.findMany({
      where: { organizationId, ...(workerId ? { userId: workerId } : {}) },
      include: {
        worker: { select: { firstName: true, lastName: true, avatarUrl: true } },
        reportedBy: { select: { firstName: true, lastName: true } },
        rtwMilestones: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { incidentDate: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const incident = await this.prisma.incident.findFirst({
      where: { id, organizationId },
      include: {
        worker: { select: { firstName: true, lastName: true, avatarUrl: true, department: { select: { name: true } } } },
        reportedBy: { select: { firstName: true, lastName: true } },
        rtwMilestones: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!incident) throw new NotFoundException('Incident not found');
    return incident;
  }

  async updateStatus(id: string, organizationId: string, status: string) {
    return this.prisma.incident.update({
      where: { id },
      data: { status: status as any },
    });
  }

  async addMilestone(incidentId: string, organizationId: string, dto: { milestoneType: string; targetDate?: string; notes?: string }) {
    const incident = await this.prisma.incident.findFirst({ where: { id: incidentId, organizationId } });
    if (!incident) throw new NotFoundException('Incident not found');

    return this.prisma.rTWMilestone.create({
      data: {
        incidentId,
        milestoneType: dto.milestoneType as any,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        notes: dto.notes,
        status: 'IN_PROGRESS',
      },
    });
  }

  async clearMilestone(milestoneId: string, clearedById: string, notes?: string) {
    return this.prisma.rTWMilestone.update({
      where: { id: milestoneId },
      data: {
        status: 'CLEARED',
        clearedAt: new Date(),
        clearedById,
        notes: notes ?? undefined,
      },
    });
  }

  async getOshaReport(organizationId: string, year?: number) {
    const y = year ?? new Date().getFullYear();
    const start = new Date(`${y}-01-01`);
    const end = new Date(`${y + 1}-01-01`);

    const incidents = await this.prisma.incident.findMany({
      where: { organizationId, isOshaRecordable: true, incidentDate: { gte: start, lt: end } },
      include: {
        worker: { select: { firstName: true, lastName: true, department: { select: { name: true } }, jobProfile: { select: { title: true } } } },
        reportedBy: { select: { firstName: true, lastName: true } },
        rtwMilestones: true,
      },
      orderBy: { incidentDate: 'asc' },
    });

    const bySeverity = incidents.reduce((acc: Record<string, number>, i) => {
      acc[i.severity] = (acc[i.severity] ?? 0) + 1;
      return acc;
    }, {});

    const byBodyPart = incidents.reduce((acc: Record<string, number>, i) => {
      acc[i.bodyPart] = (acc[i.bodyPart] ?? 0) + 1;
      return acc;
    }, {});

    return {
      year: y,
      totalRecordable: incidents.length,
      bySeverity,
      byBodyPart,
      incidents,
    };
  }
}
