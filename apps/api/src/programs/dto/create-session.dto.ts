import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SessionExerciseLogDto {
  @ApiProperty()
  @IsString()
  exerciseId: string;

  @ApiProperty()
  @IsString()
  exerciseName: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  setsCompleted: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  repsCompleted?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;

  @ApiProperty()
  @IsBoolean()
  painDuring: boolean;

  @ApiProperty()
  @IsBoolean()
  skipped: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class CreateSessionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  exercisesCompleted: number;

  @ApiProperty()
  @IsInt()
  @Min(0)
  exercisesTotal: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  durationMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [SessionExerciseLogDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SessionExerciseLogDto)
  exerciseLogs?: SessionExerciseLogDto[];
}

export class CreateSessionFeedbackDto {
  @ApiProperty({ description: 'better | same | harder' })
  @IsString()
  recoveryFeel: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  perceivedDiff: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  workReadiness: number;

  @ApiProperty()
  @IsBoolean()
  painDuring: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
