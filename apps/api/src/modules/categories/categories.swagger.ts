import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateCategoryBatchDto } from './dto/create-category-batch.dto';
import { BatchResultDto } from './dto/batch-result.dto';
import { CategoryDto } from './dto/category.dto';

export function ApiGetAllCategories() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all categories' }),
    ApiResponse({
      status: 200,
      description: 'List of all categories for the authenticated user',
      type: [CategoryDto],
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
}

export function ApiGetCategoryById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a specific category by ID' }),
    ApiParam({
      name: 'id',
      description: 'The ID of the category to retrieve',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Category found and returned successfully',
      type: CategoryDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
  );
}

export function ApiCreateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new category' }),
    ApiResponse({
      status: 201,
      description: 'Category created successfully',
      type: CategoryDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
}

export function ApiCreateCategoryBatch() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create multiple categories at once, skipping duplicates',
      description:
        'Accepts up to 50 category items. Each item is created individually; P2002 (unique constraint) errors are silently skipped. Returns the count of created and skipped items.',
    }),
    ApiBody({ type: CreateCategoryBatchDto }),
    ApiResponse({
      status: 201,
      description: 'Batch result with created and skipped counts',
      type: BatchResultDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
}

export function ApiUpdateCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing category' }),
    ApiParam({
      name: 'id',
      description: 'The ID of the category to update',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Category updated successfully',
      type: CategoryDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
  );
}

export function ApiDeleteCategory() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a category' }),
    ApiParam({
      name: 'id',
      description: 'The ID of the category to delete',
      type: 'string',
    }),
    ApiResponse({ status: 200, description: 'Category deleted successfully' }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Category not found' }),
  );
}
