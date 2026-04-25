import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AchievementsService } from './achievements.service';

@ApiTags('Achievements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('achievements')
export class AchievementsController {
  constructor(private achievementsService: AchievementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all achievements with unlock status' })
  getAchievements(@CurrentUser() user: any) {
    return this.achievementsService.getUserAchievements(user.id);
  }
}
