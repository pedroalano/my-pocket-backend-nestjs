import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { BudgetDto } from './dto/budget.dto';
import { BudgetWithSpendingDto } from './dto/budget-with-spending.dto';

export function ApiGetAllBudgets() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all budgets' }),
    ApiResponse({
      status: 200,
      description: 'List of all budgets for the authenticated user',
      type: [BudgetDto],
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
}

export function ApiGetBudgetById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a specific budget by ID' }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the budget to retrieve',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Budget found and returned successfully',
      type: BudgetDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Budget not found' }),
  );
}

export function ApiGetBudgetDetails() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get budget with spending details',
      description:
        'Returns a budget with calculated spending data including spent amount, remaining amount, and utilization percentage',
    }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the budget to retrieve with spending details',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Budget with spending calculations returned successfully',
      type: BudgetWithSpendingDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Budget not found' }),
  );
}

export function ApiGetBudgetsByCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Get budgets by category' }),
    ApiParam({
      name: 'categoryId',
      description: 'The UUID of the category to filter budgets by',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'List of budgets for the specified category',
      type: [BudgetDto],
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
  );
}

export function ApiCreateBudget() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new budget' }),
    ApiResponse({
      status: 201,
      description: 'Budget created successfully',
      type: BudgetDto,
    }),
    ApiResponse({
      status: 400,
      description:
        'Bad request - Invalid input data (e.g., month not in range 1-12)',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({
      status: 409,
      description:
        'Conflict - Budget already exists for this category, month, and year',
    }),
  );
}

export function ApiUpdateBudget() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing budget' }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the budget to update',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Budget updated successfully',
      type: BudgetDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Budget not found' }),
    ApiResponse({
      status: 409,
      description:
        'Conflict - Budget already exists for this category, month, and year',
    }),
  );
}

export function ApiDeleteBudget() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a budget' }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the budget to delete',
      type: 'string',
    }),
    ApiResponse({ status: 200, description: 'Budget deleted successfully' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Budget not found' }),
  );
}
