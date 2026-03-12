import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';
import { BudgetVsActualDto } from './dto/budget-vs-actual.dto';
import { CategoryBreakdownDto } from './dto/category-breakdown.dto';
import { TopExpenseDto } from './dto/top-expenses.dto';

const monthQuery = ApiQuery({
  name: 'month',
  type: Number,
  description: 'Month (1-12)',
  example: 3,
});

const yearQuery = ApiQuery({
  name: 'year',
  type: Number,
  description: 'Year',
  example: 2026,
});

export function ApiGetMonthlySummary() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get monthly income, expense and balance summary',
    }),
    monthQuery,
    yearQuery,
    ApiResponse({
      status: 200,
      description: 'Monthly summary retrieved successfully',
      type: MonthlySummaryDto,
    }),
    ApiResponse({ status: 400, description: 'Invalid month parameter' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetBudgetVsActual() {
  return applyDecorators(
    ApiOperation({ summary: 'Compare budgets vs actual spending by category' }),
    monthQuery,
    yearQuery,
    ApiResponse({
      status: 200,
      description: 'Budget vs actual comparison retrieved successfully',
      type: [BudgetVsActualDto],
    }),
    ApiResponse({ status: 400, description: 'Invalid month parameter' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetCategoryBreakdown() {
  return applyDecorators(
    ApiOperation({ summary: 'Get expense breakdown by category' }),
    monthQuery,
    yearQuery,
    ApiResponse({
      status: 200,
      description: 'Category breakdown retrieved successfully',
      type: [CategoryBreakdownDto],
    }),
    ApiResponse({ status: 400, description: 'Invalid month parameter' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}

export function ApiGetTopExpenses() {
  return applyDecorators(
    ApiOperation({ summary: 'Get top expenses for the month' }),
    monthQuery,
    yearQuery,
    ApiQuery({
      name: 'limit',
      type: Number,
      required: false,
      description: 'Number of top expenses to return (1-100, default: 10)',
      example: 10,
    }),
    ApiResponse({
      status: 200,
      description: 'Top expenses retrieved successfully',
      type: [TopExpenseDto],
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid month or limit parameter',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );
}
