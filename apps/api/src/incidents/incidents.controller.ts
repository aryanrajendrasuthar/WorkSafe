import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IncidentsService } from './incidents.service';
import { CreateIncidentDto } from './dto/create-incident.dto';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('THERAPIST', 'SAFETY_MANAGER', 'HR_ADMIN', 'COMPANY_ADMIN')
@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Log a new incident' })
  create(@CurrentUser() user: any, @Body() dto: CreateIncidentDto) {
    return this.incidentsService.create(user.id, user.organizationId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List incidents for organization' })
  findAll(@CurrentUser() user: any, @Query('workerId') workerId?: string) {
    return this.incidentsService.findAll(user.organizationId, workerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident by ID' })
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.incidentsService.findOne(id, user.organizationId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update incident status' })
  updateStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.incidentsService.updateStatus(id, user.organizationId, status);
  }
}
