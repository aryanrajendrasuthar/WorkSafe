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
}
