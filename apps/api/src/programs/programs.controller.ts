import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProgramsService } from './programs.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AssignProgramDto, CreateProgramDto } from './dto/create-program.dto';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private programsService: ProgramsService) {}

  @Get('my')
  @ApiOperation({ summary: "Get worker's active programs" })
  getMyPrograms(@CurrentUser() user: any) {
    return this.programsService.getWorkerPrograms(user.id);
  }

  @Get('org')
  @UseGuards(RolesGuard)
  @Roles('THERAPIST', 'SAFETY_MANAGER', 'COMPANY_ADMIN')
  @ApiOperation({ summary: "List org's programs (therapist view)" })
  listOrgPrograms(@CurrentUser() user: any) {
    return this.programsService.listOrgPrograms(user.organizationId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('THERAPIST', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Create a new program' })
  createProgram(@CurrentUser() user: any, @Body() dto: CreateProgramDto) {
    return this.programsService.createProgram(user.organizationId, user.id, dto);
  }

  @Post(':programId/assign')
  @UseGuards(RolesGuard)
  @Roles('THERAPIST', 'COMPANY_ADMIN')
  @ApiOperation({ summary: 'Assign a program to a worker' })
  assignProgram(
    @CurrentUser() user: any,
    @Param('programId') programId: string,
    @Body() dto: AssignProgramDto,
  ) {
    return this.programsService.assignProgram(programId, user.id, user.organizationId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get program with exercises by ID' })
  getProgram(@Param('id') id: string) {
    return this.programsService.getProgramById(id);
  }

  @Post(':workerProgramId/sessions')
  @ApiOperation({ summary: 'Log a completed session for a worker program' })
  logSession(
    @CurrentUser() user: any,
    @Param('workerProgramId') workerProgramId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.programsService.logSession(workerProgramId, user.id, dto);
  }

  @Get(':workerProgramId/sessions')
  @ApiOperation({ summary: 'Get session history for a worker program' })
  getSessionHistory(@CurrentUser() user: any, @Param('workerProgramId') workerProgramId: string) {
    return this.programsService.getSessionHistory(workerProgramId, user.id);
  }
}
