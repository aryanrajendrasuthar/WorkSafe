import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BodyPart, IncidentSeverity } from '@prisma/client';

export class CreateIncidentDto {
  @ApiProperty()
  @IsString()
  workerId: string;

  @ApiProperty({ enum: BodyPart })
  @IsEnum(BodyPart)
  bodyPart: BodyPart;

  @ApiProperty()
  @IsString()
  injuryType: string;

  @ApiProperty({ enum: IncidentSeverity, required: false })
  @IsOptional()
  @IsEnum(IncidentSeverity)
  severity?: IncidentSeverity;

  @ApiProperty()
  @IsDateString()
  incidentDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taskAtTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isOshaRecordable?: boolean;
}
