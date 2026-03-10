import { describe, it, expect, beforeEach } from 'vitest';
import { transactionsApi } from './transactions';
import { TransactionType } from '@/types';
import { ApiException, setAccessToken } from './api';
import { mockToken } from '@/test/mocks/handlers';

describe('transactionsApi', () => {
  beforeEach(() => {
    setAccessToken(mockToken);
  });

  describe('getAll', () => {
    it('should fetch all transactions', async () => {
      const result = await transactionsApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('categoryId');
      expect(result[0]).toHaveProperty('date');
    });

    it('should throw ApiException on 401', async () => {
      setAccessToken(null);

      await expect(transactionsApi.getAll()).rejects.toThrow(ApiException);
    });
  });

  describe('getById', () => {
    it('should fetch transaction by id', async () => {
      const result = await transactionsApi.getById('transaction-1');

      expect(result.id).toBe('transaction-1');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('categoryId');
      expect(result).toHaveProperty('date');
    });

    it('should throw ApiException on 404', async () => {
      try {
        await transactionsApi.getById('non-existent-id');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const newTransaction = {
        amount: 99.99,
        type: TransactionType.EXPENSE,
        categoryId: 'cat-2',
        date: '2026-03-05T10:00:00.000Z',
        description: 'Test transaction',
      };

      const result = await transactionsApi.create(newTransaction);

      expect(result.id).toBeDefined();
      expect(result.amount).toBe('99.99');
      expect(result.type).toBe(TransactionType.EXPENSE);
      expect(result.categoryId).toBe('cat-2');
      expect(result.date).toBe('2026-03-05T10:00:00.000Z');
      expect(result.description).toBe('Test transaction');
    });

    it('should create a transaction without description', async () => {
      const newTransaction = {
        amount: 50,
        type: TransactionType.INCOME,
        categoryId: 'cat-1',
        date: '2026-03-05T10:00:00.000Z',
      };

      const result = await transactionsApi.create(newTransaction);

      expect(result.id).toBeDefined();
      expect(result.amount).toBe('50.00');
    });
  });

  describe('update', () => {
    it('should update an existing transaction', async () => {
      const result = await transactionsApi.update('transaction-1', {
        amount: 200,
      });

      expect(result.id).toBe('transaction-1');
      expect(result.amount).toBe('200.00');
    });

    it('should throw ApiException on 404', async () => {
      try {
        await transactionsApi.update('non-existent-id', { amount: 100 });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });

  describe('delete', () => {
    it('should delete a transaction', async () => {
      const result = await transactionsApi.delete('transaction-1');

      expect(result).toBeUndefined();
    });

    it('should throw ApiException on 404', async () => {
      try {
        await transactionsApi.delete('non-existent-id');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });
});
