import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { BudgetVsActualDto } from './dto/budget-vs-actual.dto';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  private validateMonth(month: number): void {
    if (month < 1 || month > 12) {
      throw new BadRequestException(
        'Invalid month. Month must be between 1 and 12.',
      );
    }
  }

  @Get('monthly-summary')
  @UseGuards(JwtAuthGuard)
  async getMonthlySummary(
    @Req() req: AuthenticatedRequest,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<MonthlySummaryDto> {
    this.validateMonth(month);

    const userId = req.user.userId;
    return this.dashboardService.getMonthlySummary(userId, month, year);
  }

  @Get('budget-vs-actual')
  @UseGuards(JwtAuthGuard)
  async getBudgetVsActual(
    @Req() req: AuthenticatedRequest,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<BudgetVsActualDto[]> {
    this.validateMonth(month);

    const userId = req.user.userId;
    return this.dashboardService.getBudgetVsActual(userId, month, year);
  }
}
