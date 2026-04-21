import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}
