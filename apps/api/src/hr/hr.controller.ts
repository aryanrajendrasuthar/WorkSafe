import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HrService } from './hr.service';

@ApiTags('HR Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private hrService: HrService) {}

  @Get('stats')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Get HR/org overview stats' })
  getStats(@CurrentUser() user: any) {
    return this.hrService.getOrgStats(user.organizationId);
  }

  @Patch('org')
  @Roles('COMPANY_ADMIN')
  @ApiOperation({ summary: 'Update organization details' })
  updateOrg(
    @CurrentUser() user: any,
    @Body() body: { name?: string; industry?: string },
  ) {
    return this.hrService.updateOrg(user.organizationId, body);
  }

  // ── Departments ─────────────────────────────────────────────────────────────

  @Get('departments')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN', 'SAFETY_MANAGER', 'THERAPIST')
  @ApiOperation({ summary: 'List departments' })
  getDepartments(@CurrentUser() user: any) {
    return this.hrService.getDepartments(user.organizationId);
  }

  @Post('departments')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Create department' })
  createDepartment(
    @CurrentUser() user: any,
    @Body() body: { name: string; description?: string; location?: string },
  ) {
    return this.hrService.createDepartment(
      user.organizationId,
      body.name,
      body.description,
      body.location,
    );
  }

  @Patch('departments/:id')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Update department' })
  patchDepartment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { name: string; description?: string; location?: string },
  ) {
    return this.hrService.updateDepartment(
      id,
      user.organizationId,
      body.name,
      body.description,
      body.location,
    );
  }

  @Delete('departments/:id')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.deleteDepartment(id, user.organizationId);
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  @Get('users')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'List all users in org' })
  getUsers(@CurrentUser() user: any) {
    return this.hrService.getUsers(user.organizationId);
  }

  @Patch('users/:id/role')
  @Roles('COMPANY_ADMIN')
  @ApiOperation({ summary: 'Update user role' })
  updateRole(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.hrService.updateUserRole(id, user.organizationId, role);
  }

  @Patch('users/:id/department')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Move user to department' })
  moveUserDepartment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('departmentId') departmentId: string | null,
  ) {
    return this.hrService.updateUserDepartment(
      id,
      user.organizationId,
      departmentId ?? null,
    );
  }

  @Patch('users/:id/deactivate')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Deactivate user' })
  deactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.setUserActive(id, user.organizationId, false);
  }

  @Patch('users/:id/reactivate')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Reactivate user' })
  reactivate(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.setUserActive(id, user.organizationId, true);
  }

  // ── Invites ─────────────────────────────────────────────────────────────────

  @Get('invites')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'List all invites' })
  getInvites(@CurrentUser() user: any) {
    return this.hrService.getInvites(user.organizationId);
  }

  @Delete('invites/:id')
  @Roles('HR_ADMIN', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Revoke an invite' })
  deleteInvite(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.deleteInvite(id, user.organizationId);
  }

  // ── Audit Logs ──────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @Roles('COMPANY_ADMIN', 'HR_ADMIN')
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(@CurrentUser() user: any, @Query('limit') limit?: string) {
    return this.hrService.getAuditLogs(
      user.organizationId,
      limit ? parseInt(limit) : 100,
    );
  }
}
