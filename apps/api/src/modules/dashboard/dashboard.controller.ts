import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetMonthlySummary,
  ApiGetBudgetVsActual,
  ApiGetCategoryBreakdown,
  ApiGetTopExpenses,
} from './dashboard.swagger';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
import { BudgetVsActualDto } from './dto/budget-vs-actual.dto';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';
import { CategoryBreakdownDto } from './dto/category-breakdown.dto';
import { TopExpenseDto } from './dto/top-expenses.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private dashboardService: DashboardService,
    private i18n: I18nService,
  ) {}

  private get lang(): string {
    return I18nContext.current()?.lang ?? 'en';
  }

  private validateMonth(month: number): void {
    if (month < 1 || month > 12) {
      throw new BadRequestException(
        this.i18n.t('dashboard.errors.invalidMonth', { lang: this.lang }),
      );
    }
  }

  private validateLimit(limit: number): void {
    if (limit < 1 || limit > 100) {
      throw new BadRequestException(
        this.i18n.t('dashboard.errors.invalidLimit', { lang: this.lang }),
      );
    }
  }

  @Get('monthly-summary')
  @ApiGetMonthlySummary()
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
  @ApiGetBudgetVsActual()
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
  @ApiGetCategoryBreakdown()
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
  @ApiGetTopExpenses()
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
