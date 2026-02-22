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
import { CategoryBreakdownDto } from './dto/category-breakdown.dto';
import { TopExpenseDto } from './dto/top-expenses.dto';

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

  private validateLimit(limit: number): void {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException(
        'Invalid limit. Limit must be between 1 and 100.',
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

  @Get('category-breakdown')
  @UseGuards(JwtAuthGuard)
  async getCategoryBreakdown(
    @Req() req: AuthenticatedRequest,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ): Promise<CategoryBreakdownDto[]> {
    this.validateMonth(month);

    const userId = req.user.userId;
    return this.dashboardService.getCategoryBreakdown(userId, month, year);
  }

  @Get('top-expenses')
  @UseGuards(JwtAuthGuard)
  async getTopExpenses(
    @Req() req: AuthenticatedRequest,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<TopExpenseDto[]> {
    this.validateMonth(month);

    if (limit !== undefined) {
      this.validateLimit(limit);
    }

    const userId = req.user.userId;
    return this.dashboardService.getTopExpenses(
      userId,
      month,
      year,
      limit ?? 10,
    );
  }
}
