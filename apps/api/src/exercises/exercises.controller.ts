import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { BodyPart, ExerciseDifficulty, ProgramGoal } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExercisesService } from './exercises.service';

@ApiTags('Exercises')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Get()
  @ApiOperation({ summary: 'List exercises with optional filters' })
  findAll(
    @Query('bodyPart') bodyPart?: BodyPart,
    @Query('difficulty') difficulty?: ExerciseDifficulty,
    @Query('goal') goal?: ProgramGoal,
    @Query('search') search?: string,
  ) {
    return this.exercisesService.findAll({
      bodyPart,
      difficulty,
      goal,
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get exercise by ID' })
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }
}
