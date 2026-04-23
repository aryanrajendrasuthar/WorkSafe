import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { BodyPart, PainSeverity } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class BodyAreaEntryDto {
  @ApiProperty({ enum: BodyPart })
  @IsEnum(BodyPart)
  bodyPart: BodyPart;

  @ApiProperty({ minimum: 0, maximum: 10 })
  @IsInt()
  @Min(0)
  @Max(10)
  intensity: number;

  @ApiProperty({ enum: PainSeverity, required: false })
  @IsOptional()
  @IsEnum(PainSeverity)
  severity?: PainSeverity;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taskCorrelation?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateCheckinDto {
  @ApiProperty({ enum: PainSeverity })
  @IsEnum(PainSeverity)
  overallStatus: PainSeverity;

  @ApiProperty({ type: [BodyAreaEntryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BodyAreaEntryDto)
  bodyAreas: BodyAreaEntryDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
