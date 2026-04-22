import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RiskService } from './risk.service';

@ApiTags('Risk')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SAFETY_MANAGER', 'COMPANY_ADMIN', 'THERAPIST')
@Controller('risk')
export class RiskController {
  constructor(private riskService: RiskService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get org-wide risk summary for safety dashboard' })
  getOrgSummary(@CurrentUser() user: any) {
    return this.riskService.getOrgSummary(user.organizationId);
  }

  @Get('departments/:id')
  @ApiOperation({ summary: 'Get department risk detail' })
  getDeptDetail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.riskService.getDepartmentDetail(id, user.organizationId);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get all alerts for org' })
  getAlerts(@CurrentUser() user: any) {
    return this.riskService.getAlerts(user.organizationId);
  }

  @Patch('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  acknowledgeAlert(@CurrentUser() user: any, @Param('id') id: string) {
    return this.riskService.acknowledgeAlert(id, user.id, user.organizationId);
  }

  @Patch('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  resolveAlert(@CurrentUser() user: any, @Param('id') id: string) {
    return this.riskService.resolveAlert(id, user.organizationId);
  }

  @Get('check-alerts')
  @ApiOperation({ summary: 'Trigger alert check (can be called by cron or manually)' })
  checkAlerts(@CurrentUser() user: any) {
    return this.riskService.checkAndCreateAlerts(user.organizationId);
  }
}
