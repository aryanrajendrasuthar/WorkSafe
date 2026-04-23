import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';

@Module({
  imports: [ConfigModule],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService],
})
export class HrModule {}
