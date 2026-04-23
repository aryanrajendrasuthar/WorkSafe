import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';

@ApiTags('Checkins')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkins')
export class CheckinsController {
  constructor(private checkinsService: CheckinsService) {}

  @Post()
  @ApiOperation({ summary: 'Submit daily check-in' })
  create(@CurrentUser() user: any, @Body() dto: CreateCheckinDto) {
    return this.checkinsService.createCheckin(user.id, dto);
  }

  @Get('today')
  @ApiOperation({ summary: "Get today's check-in if it exists" })
  getToday(@CurrentUser() user: any) {
    return this.checkinsService.getTodayCheckin(user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get check-in history (heatmap data)' })
  getHistory(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.checkinsService.getHistory(user.id, days ? parseInt(days) : 90);
  }

  @Get('trend')
  @ApiOperation({ summary: 'Get pain trend by body area (chart data)' })
  getTrend(@CurrentUser() user: any, @Query('days') days?: string) {
    return this.checkinsService.getPainTrend(
      user.id,
      days ? parseInt(days) : 30,
    );
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get current check-in streak' })
  async getStreak(@CurrentUser() user: any) {
    const streak = await this.checkinsService.calculateStreak(user.id);
    return { streak };
  }
}
