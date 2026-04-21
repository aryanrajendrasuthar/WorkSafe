import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkersService } from './workers.service';
import { OnboardingDto } from './dto/onboarding.dto';

@ApiTags('Workers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workers')
export class WorkersController {
  constructor(private workersService: WorkersService) {}

  @Post('onboarding')
  @ApiOperation({ summary: 'Complete worker onboarding / job profile setup' })
  async completeOnboarding(
    @CurrentUser() user: { id: string },
    @Body() dto: OnboardingDto,
  ) {
    return this.workersService.completeOnboarding(user.id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get worker stats: streaks, check-in count, active programs' })
  async getStats(@CurrentUser() user: { id: string }) {
    return this.workersService.getWorkerStats(user.id);
  }
}
