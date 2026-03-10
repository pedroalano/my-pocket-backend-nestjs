import { describe, it, expect, beforeEach } from 'vitest';
import { budgetsApi } from './budgets';
import { BudgetType } from '@/types';
import { ApiException, setAccessToken } from './api';
import { mockToken } from '@/test/mocks/handlers';

describe('budgetsApi', () => {
  beforeEach(() => {
    setAccessToken(mockToken);
  });

  describe('getAll', () => {
    it('should fetch all budgets', async () => {
      const result = await budgetsApi.getAll();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('amount');
      expect(result[0]).toHaveProperty('categoryId');
      expect(result[0]).toHaveProperty('month');
      expect(result[0]).toHaveProperty('year');
      expect(result[0]).toHaveProperty('type');
    });

    it('should throw ApiException on 401', async () => {
      setAccessToken(null);

      await expect(budgetsApi.getAll()).rejects.toThrow(ApiException);
    });
  });

  describe('getById', () => {
    it('should fetch budget by id', async () => {
      const result = await budgetsApi.getById('budget-1');

      expect(result.id).toBe('budget-1');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('categoryId');
    });

    it('should throw ApiException on 404', async () => {
      try {
        await budgetsApi.getById('non-existent-id');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });

  describe('getDetails', () => {
    it('should fetch budget with spending details', async () => {
      const result = await budgetsApi.getDetails('budget-1');

      expect(result.id).toBe('budget-1');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('categoryId');
      expect(result).toHaveProperty('spent');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('utilizationPercentage');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('transactions');
      expect(Array.isArray(result.transactions)).toBe(true);
    });

    it('should throw ApiException on 404', async () => {
      try {
        await budgetsApi.getDetails('non-existent-id');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });

    it('should throw ApiException on 401', async () => {
      setAccessToken(null);

      await expect(budgetsApi.getDetails('budget-1')).rejects.toThrow(
        ApiException,
      );
    });
  });

  describe('getByCategory', () => {
    it('should fetch budgets by category', async () => {
      const result = await budgetsApi.getByCategory('cat-2');

      expect(Array.isArray(result)).toBe(true);
      result.forEach((budget) => {
        expect(budget.categoryId).toBe('cat-2');
        expect(budget).toHaveProperty('spent');
        expect(budget).toHaveProperty('remaining');
        expect(budget).toHaveProperty('utilizationPercentage');
      });
    });

    it('should return empty array when no budgets for category', async () => {
      const result = await budgetsApi.getByCategory('non-existent-category');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should throw ApiException on 401', async () => {
      setAccessToken(null);

      await expect(budgetsApi.getByCategory('cat-2')).rejects.toThrow(
        ApiException,
      );
    });
  });

  describe('create', () => {
    it('should create a new budget', async () => {
      const newBudget = {
        amount: 1000,
        categoryId: 'cat-1',
        month: 3,
        year: 2026,
        type: BudgetType.EXPENSE,
      };

      const result = await budgetsApi.create(newBudget);

      expect(result.id).toBeDefined();
      expect(result.amount).toBe('1000.00');
      expect(result.categoryId).toBe('cat-1');
      expect(result.month).toBe(3);
      expect(result.year).toBe(2026);
      expect(result.type).toBe(BudgetType.EXPENSE);
    });
  });

  describe('update', () => {
    it('should update an existing budget', async () => {
      const result = await budgetsApi.update('budget-1', {
        amount: 750,
      });

      expect(result.id).toBe('budget-1');
      expect(result.amount).toBe('750.00');
    });

    it('should throw ApiException on 404', async () => {
      try {
        await budgetsApi.update('non-existent-id', { amount: 500 });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });

  describe('delete', () => {
    it('should delete a budget', async () => {
      const result = await budgetsApi.delete('budget-1');

      expect(result).toBeUndefined();
    });

    it('should throw ApiException on 404', async () => {
      try {
        await budgetsApi.delete('non-existent-id');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        const apiError = error as ApiException;
        expect(apiError.statusCode).toBe(404);
      }
    });
  });
});
