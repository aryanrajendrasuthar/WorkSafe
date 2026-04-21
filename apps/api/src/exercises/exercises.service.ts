import { Injectable } from '@nestjs/common';
import { BodyPart, ExerciseDifficulty, ProgramGoal } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface ExerciseFilters {
  bodyPart?: BodyPart;
  difficulty?: ExerciseDifficulty;
  goal?: ProgramGoal;
  search?: string;
}

@Injectable()
export class ExercisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ExerciseFilters) {
    const where: any = { isActive: true };

    if (filters.bodyPart) {
      where.bodyRegions = { has: filters.bodyPart };
    }
    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters.goal) {
      where.goals = { has: filters.goal };
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.exercise.findMany({
      where,
      orderBy: [{ difficulty: 'asc' }, { name: 'asc' }],
    });
  }

  findOne(id: string) {
    return this.prisma.exercise.findUnique({ where: { id } });
  }
}
