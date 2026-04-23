import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BodyPart, JobCategory, ProgramGoal } from '@prisma/client';

export class ProgramExerciseDto {
  @ApiProperty()
  @IsString()
  exerciseId: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  sets?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  reps?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  durationSec?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  restSec?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateProgramDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: JobCategory })
  @IsEnum(JobCategory)
  jobCategory: JobCategory;

  @ApiProperty({ enum: ProgramGoal })
  @IsEnum(ProgramGoal)
  goal: ProgramGoal;

  @ApiProperty({ type: [String] })
  @IsArray()
  bodyRegions: BodyPart[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationWeeks?: number;

  @ApiProperty({ type: [ProgramExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramExerciseDto)
  exercises: ProgramExerciseDto[];
}

export class AssignProgramDto {
  @ApiProperty()
  @IsString()
  workerId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
