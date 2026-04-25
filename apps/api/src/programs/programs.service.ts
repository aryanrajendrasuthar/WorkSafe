import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AchievementsService } from '../achievements/achievements.service';
import {
  CreateSessionDto,
  CreateSessionFeedbackDto,
} from './dto/create-session.dto';
import { AssignProgramDto, CreateProgramDto } from './dto/create-program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    private prisma: PrismaService,
    private achievements: AchievementsService,
  ) {}

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
      const completedExercises = wp.sessionLogs.reduce(
        (s, l) => s + l.exercisesCompleted,
        0,
      );
      const totalExercises = wp.sessionLogs.reduce(
        (s, l) => s + l.exercisesTotal,
        0,
      );
      const completionRate =
        totalExercises > 0
          ? Math.round((completedExercises / totalExercises) * 100)
          : 0;

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

  async logSession(
    workerProgramId: string,
    userId: string,
    dto: CreateSessionDto,
  ) {
    const workerProgram = await this.prisma.workerProgram.findFirst({
      where: { id: workerProgramId, userId },
    });
    if (!workerProgram) throw new NotFoundException('Worker program not found');

    const session = await this.prisma.sessionLog.create({
      data: {
        workerProgramId,
        exercisesCompleted: dto.exercisesCompleted,
        exercisesTotal: dto.exercisesTotal,
        durationMin: dto.durationMin,
        notes: dto.notes,
        ...(dto.exerciseLogs?.length
          ? {
              exerciseLogs: {
                create: dto.exerciseLogs.map((el) => ({
                  exerciseId: el.exerciseId,
                  exerciseName: el.exerciseName,
                  setsCompleted: el.setsCompleted,
                  repsCompleted: el.repsCompleted,
                  durationSec: el.durationSec,
                  painDuring: el.painDuring,
                  skipped: el.skipped,
                  sortOrder: el.sortOrder,
                })),
              },
            }
          : {}),
      },
      include: { exerciseLogs: true },
    });

    // Fire achievement check asynchronously — don't block the session log response
    this.achievements.checkAndUnlock(userId).catch(() => {});

    return session;
  }

  async addSessionFeedback(
    sessionLogId: string,
    workerProgramId: string,
    userId: string,
    dto: CreateSessionFeedbackDto,
  ) {
    const session = await this.prisma.sessionLog.findFirst({
      where: { id: sessionLogId, workerProgramId },
      include: { workerProgram: { select: { userId: true } } },
    });
    if (!session || session.workerProgram.userId !== userId) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.sessionFeedback.upsert({
      where: { sessionLogId },
      update: {
        recoveryFeel: dto.recoveryFeel,
        perceivedDiff: dto.perceivedDiff,
        workReadiness: dto.workReadiness,
        painDuring: dto.painDuring,
        notes: dto.notes,
      },
      create: {
        sessionLogId,
        recoveryFeel: dto.recoveryFeel,
        perceivedDiff: dto.perceivedDiff,
        workReadiness: dto.workReadiness,
        painDuring: dto.painDuring,
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
      include: { exerciseLogs: true, feedback: true },
      orderBy: { date: 'desc' },
    });
  }

  async createProgram(
    organizationId: string,
    createdById: string,
    dto: CreateProgramDto,
  ) {
    return this.prisma.program.create({
      data: {
        organizationId,
        createdById,
        name: dto.name,
        description: dto.description,
        jobCategory: dto.jobCategory,
        goal: dto.goal,
        bodyRegions: dto.bodyRegions,
        durationWeeks: dto.durationWeeks ?? 4,
        programExercises: {
          create: dto.exercises.map((e) => ({
            exerciseId: e.exerciseId,
            order: e.order,
            sets: e.sets ?? 3,
            reps: e.reps,
            durationSec: e.durationSec,
            restSec: e.restSec ?? 60,
            notes: e.notes,
          })),
        },
      },
      include: {
        programExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async listOrgPrograms(organizationId: string) {
    return this.prisma.program.findMany({
      where: { organizationId, isActive: true },
      include: {
        programExercises: {
          include: { exercise: true },
          orderBy: { order: 'asc' },
        },
        _count: { select: { workerPrograms: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignProgram(
    programId: string,
    assignedById: string,
    organizationId: string,
    dto: AssignProgramDto,
  ) {
    const [program, worker] = await Promise.all([
      this.prisma.program.findFirst({
        where: { id: programId, organizationId },
      }),
      this.prisma.user.findFirst({
        where: { id: dto.workerId, organizationId, role: 'WORKER' },
      }),
    ]);
    if (!program) throw new NotFoundException('Program not found');
    if (!worker) throw new NotFoundException('Worker not found');

    return this.prisma.workerProgram.create({
      data: {
        userId: dto.workerId,
        programId,
        assignedById,
        notes: dto.notes,
      },
      include: { program: { select: { name: true } } },
    });
  }
}
