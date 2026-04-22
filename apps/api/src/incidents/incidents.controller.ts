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

  @Get('osha')
  @ApiOperation({ summary: 'Get OSHA recordable incidents report' })
  oshaReport(@CurrentUser() user: any, @Query('year') year?: string) {
    return this.incidentsService.getOshaReport(user.organizationId, year ? parseInt(year) : undefined);
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

  @Post(':id/milestones')
  @ApiOperation({ summary: 'Add RTW milestone to incident' })
  addMilestone(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: { milestoneType: string; targetDate?: string; notes?: string },
  ) {
    return this.incidentsService.addMilestone(id, user.organizationId, dto);
  }

  @Patch('milestones/:milestoneId/clear')
  @ApiOperation({ summary: 'Clear (sign off) an RTW milestone' })
  clearMilestone(
    @CurrentUser() user: any,
    @Param('milestoneId') milestoneId: string,
    @Body('notes') notes?: string,
  ) {
    return this.incidentsService.clearMilestone(milestoneId, user.id, notes);
  }
}
