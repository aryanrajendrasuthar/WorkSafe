import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TherapistService } from './therapist.service';

@ApiTags('Therapist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('THERAPIST', 'COMPANY_ADMIN')
@Controller('therapist')
export class TherapistController {
  constructor(private therapistService: TherapistService) {}

  @Get('workers')
  @ApiOperation({ summary: 'List all workers with risk scores' })
  getWorkers(@CurrentUser() user: any) {
    return this.therapistService.getWorkers(user.organizationId);
  }

  @Get('workers/:id')
  @ApiOperation({ summary: 'Get detailed worker profile with pain history' })
  getWorkerDetail(@CurrentUser() user: any, @Param('id') workerId: string) {
    return this.therapistService.getWorkerDetail(workerId, user.organizationId);
  }

  @Get('escalations')
  @ApiOperation({ summary: 'Get workers with escalating pain trends (7-day delta)' })
  getEscalations(@CurrentUser() user: any) {
    return this.therapistService.getEscalations(user.organizationId);
  }
}
