import { IsString, IsEnum, IsOptional, IsInt, IsNumber, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhysicalDemandLevel, ShiftType, JobCategory, BodyPart } from '@prisma/client';

export class OnboardingDto {
  @ApiProperty({ example: 'Warehouse Associate' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ enum: JobCategory })
  @IsEnum(JobCategory)
  jobCategory: JobCategory;

  @ApiProperty({ enum: PhysicalDemandLevel })
  @IsEnum(PhysicalDemandLevel)
  physicalDemandLevel: PhysicalDemandLevel;

  @ApiProperty({ enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @ApiPropertyOptional({ type: [String], example: ['LOWER_BACK', 'LEFT_WRIST_HAND'] })
  @IsOptional()
  @IsArray()
  @IsEnum(BodyPart, { each: true })
  preExistingPainAreas?: BodyPart[];

  @ApiPropertyOptional({ type: [String], example: ['Repetitive lifting', 'Extended standing'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryRisks?: string[];

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsInRole?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  hoursPerDay?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;
}
