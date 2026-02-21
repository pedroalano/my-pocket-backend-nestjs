import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { SharedModule } from '../shared';

@Module({
  imports: [SharedModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
