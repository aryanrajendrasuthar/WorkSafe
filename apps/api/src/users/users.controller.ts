import { Controller, Get, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.COMPANY_ADMIN, Role.HR_ADMIN, Role.THERAPIST, Role.SAFETY_MANAGER)
  @ApiOperation({ summary: 'List all users in organization' })
  async findAll(
    @CurrentUser() user: { organizationId: string },
    @Query('role') role?: Role,
  ) {
    return this.usersService.findByOrg(user.organizationId, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  async update(
    @Param('id') id: string,
    @Body() body: { firstName?: string; lastName?: string; avatarUrl?: string; departmentId?: string },
  ) {
    return this.usersService.updateUser(id, body);
  }
}
