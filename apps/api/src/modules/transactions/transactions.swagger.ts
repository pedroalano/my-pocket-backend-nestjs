import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TransactionDto } from './dto/transaction.dto';

export function ApiGetAllTransactions() {
  return applyDecorators(
    ApiOperation({ summary: 'Get all transactions' }),
    ApiResponse({
      status: 200,
      description: 'List of all transactions for the authenticated user',
      type: [TransactionDto],
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
  );
}

export function ApiGetTransactionById() {
  return applyDecorators(
    ApiOperation({ summary: 'Get a specific transaction by ID' }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the transaction to retrieve',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction found and returned successfully',
      type: TransactionDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Transaction not found' }),
  );
}

export function ApiCreateTransaction() {
  return applyDecorators(
    ApiOperation({ summary: 'Create a new transaction' }),
    ApiResponse({
      status: 201,
      description: 'Transaction created successfully',
      type: TransactionDto,
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

export function ApiUpdateTransaction() {
  return applyDecorators(
    ApiOperation({ summary: 'Update an existing transaction' }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the transaction to update',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction updated successfully',
      type: TransactionDto,
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input data',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Transaction not found' }),
  );
}

export function ApiDeleteTransaction() {
  return applyDecorators(
    ApiOperation({ summary: 'Delete a transaction' }),
    ApiParam({
      name: 'id',
      description: 'The UUID of the transaction to delete',
      type: 'string',
    }),
    ApiResponse({
      status: 200,
      description: 'Transaction deleted successfully',
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Invalid or missing JWT token',
    }),
    ApiResponse({ status: 404, description: 'Transaction not found' }),
  );
}
