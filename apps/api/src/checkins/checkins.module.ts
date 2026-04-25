import { Module } from '@nestjs/common';
import { CheckinsController } from './checkins.controller';
import { CheckinsService } from './checkins.service';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [AchievementsModule],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
