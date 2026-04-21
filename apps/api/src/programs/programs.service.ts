import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Injectable()
export class ProgramsService {
  constructor(private prisma: PrismaService) {}

  async getWorkerPrograms(userId: string) {
    const workerPrograms = await this.prisma.workerProgram.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        program: {
          include: {
            programExercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        sessionLogs: { orderBy: { date: 'desc' }, take: 10 },
      },
      orderBy: { startDate: 'desc' },
    });

    return workerPrograms.map((wp) => {
      const totalSessions = wp.sessionLogs.length;
      const completedExercises = wp.sessionLogs.reduce((s, l) => s + l.exercisesCompleted, 0);
      const totalExercises = wp.sessionLogs.reduce((s, l) => s + l.exercisesTotal, 0);
      const completionRate = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

      return { ...wp, totalSessions, completionRate };
    });
  }

  async getProgramById(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
      include: {
        programExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async logSession(workerProgramId: string, userId: string, dto: CreateSessionDto) {
    const workerProgram = await this.prisma.workerProgram.findFirst({
      where: { id: workerProgramId, userId },
    });
    if (!workerProgram) throw new NotFoundException('Worker program not found');

    return this.prisma.sessionLog.create({
      data: {
        workerProgramId,
        exercisesCompleted: dto.exercisesCompleted,
        exercisesTotal: dto.exercisesTotal,
        durationMin: dto.durationMin,
        notes: dto.notes,
      },
    });
  }

  async getSessionHistory(workerProgramId: string, userId: string) {
    const workerProgram = await this.prisma.workerProgram.findFirst({
      where: { id: workerProgramId, userId },
    });
    if (!workerProgram) throw new NotFoundException('Worker program not found');

    return this.prisma.sessionLog.findMany({
      where: { workerProgramId },
      orderBy: { date: 'desc' },
    });
  }
}
