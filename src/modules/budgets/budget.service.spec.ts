import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

describe('BudgetService', () => {
  let service: BudgetService;
  let categoriesService: CategoriesService;
  let transactionsService: TransactionsService;
  const categoryId = '11111111-1111-1111-1111-111111111111';
  const otherCategoryId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: CategoriesService,
          useValue: {
            getCategoryById: jest.fn(),
          },
        },
        {
          provide: TransactionsService,
          useValue: {
            getAllTransactions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    transactionsService = module.get<TransactionsService>(TransactionsService);

    // Default mock return values
    jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
      id: categoryId,
      name: 'Groceries',
      type: 'expense',
    } as any);
    jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([]);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBudget', () => {
    it('should create a new budget with valid data', async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };

      const result = await service.createBudget(createDto);

      expect(result).toEqual({
        id: 1,
        ...createDto,
      });
      expect(categoriesService.getCategoryById).toHaveBeenCalledWith(
        categoryId,
      );
    });

    it('should throw BadRequestException when month is less than 1', async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 0,
        year: 2026,
        type: 'expense',
      };

      await expect(service.createBudget(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBudget(createDto)).rejects.toThrow(
        'Month must be between 1 and 12',
      );
    });

    it('should throw BadRequestException when month is greater than 12', async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 13,
        year: 2026,
        type: 'expense',
      };

      await expect(service.createBudget(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBudget(createDto)).rejects.toThrow(
        'Month must be between 1 and 12',
      );
    });

    it('should throw BadRequestException when category does not exist', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue(null);

      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId: otherCategoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };

      await expect(service.createBudget(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBudget(createDto)).rejects.toThrow(
        `Category with ID ${otherCategoryId} does not exist`,
      );
    });

    it('should throw BadRequestException when duplicate budget exists', async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };

      await service.createBudget(createDto);

      await expect(service.createBudget(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createBudget(createDto)).rejects.toThrow(
        `Budget for category ${categoryId}, type expense, month 1, and year 2026 already exists`,
      );
    });

    it('should allow creating different budgets for different months', async () => {
      const createDto1: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };

      const createDto2: CreateBudgetDto = {
        amount: 600,
        categoryId,
        month: 2,
        year: 2026,
        type: 'expense',
      };

      const result1 = await service.createBudget(createDto1);
      const result2 = await service.createBudget(createDto2);

      expect(result1.id).toBe(1);
      expect(result2.id).toBe(2);
      expect(service.getAllBudgets()).toHaveLength(2);
    });
  });

  describe('updateBudget', () => {
    beforeEach(async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto);
    });

    it('should update budget amount', async () => {
      const updateDto: UpdateBudgetDto = {
        amount: 700,
      };

      const result = await service.updateBudget(1, updateDto);

      expect(result).toEqual({
        id: 1,
        amount: 700,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      });
    });

    it('should return null when budget does not exist', async () => {
      const updateDto: UpdateBudgetDto = {
        amount: 700,
      };

      const result = await service.updateBudget(999, updateDto);

      expect(result).toBeNull();
    });

    it('should throw BadRequestException when updating to invalid month', async () => {
      const updateDto: UpdateBudgetDto = {
        month: 13,
      };

      await expect(service.updateBudget(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateBudget(1, updateDto)).rejects.toThrow(
        'Month must be between 1 and 12',
      );
    });

    it('should throw BadRequestException when updating to non-existent category', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue(null);

      const updateDto: UpdateBudgetDto = {
        categoryId: otherCategoryId,
      };

      await expect(service.updateBudget(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateBudget(1, updateDto)).rejects.toThrow(
        `Category with ID ${otherCategoryId} does not exist`,
      );
    });

    it('should allow budget to update itself without duplicate error', async () => {
      const updateDto: UpdateBudgetDto = {
        amount: 800,
        month: 1,
        year: 2026,
      };

      const result = await service.updateBudget(1, updateDto);

      expect(result).toEqual({
        id: 1,
        amount: 800,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      });
    });

    it('should throw BadRequestException when updating creates duplicate', async () => {
      // Create second budget
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: otherCategoryId,
        name: 'Entertainment',
        type: 'expense',
      } as any);

      const createDto2: CreateBudgetDto = {
        amount: 300,
        categoryId: otherCategoryId,
        month: 2,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto2);

      // Try to update second budget to conflict with first
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Groceries',
        type: 'expense',
      } as any);

      const updateDto: UpdateBudgetDto = {
        categoryId,
        month: 1,
      };

      await expect(service.updateBudget(2, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateBudget(2, updateDto)).rejects.toThrow(
        `Budget for category ${categoryId}, type expense, month 1, and year 2026 already exists`,
      );
    });
  });

  describe('getSpentAmount', () => {
    beforeEach(async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto);

      // Mock transactions
      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 100,
          categoryId,
          type: 'expense',
          date: '2026-01-15',
          description: 'Transaction 1',
        },
        {
          id: 2,
          amount: 150,
          categoryId,
          type: 'expense',
          date: '2026-01-20',
          description: 'Transaction 2',
        },
        {
          id: 3,
          amount: 200,
          categoryId,
          type: 'expense',
          date: '2026-02-10',
          description: 'Different month',
        },
        {
          id: 4,
          amount: 75,
          categoryId: otherCategoryId,
          type: 'expense',
          date: '2026-01-10',
          description: 'Different category',
        },
      ] as any);
    });

    it('should calculate spent amount for budget', () => {
      const spent = service.getSpentAmount(1);

      expect(spent).toBe(250);
    });

    it('should return 0 when budget does not exist', () => {
      const spent = service.getSpentAmount(999);

      expect(spent).toBe(0);
    });

    it('should return 0 when no transactions match', () => {
      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([]);

      const spent = service.getSpentAmount(1);

      expect(spent).toBe(0);
    });

    it('should filter transactions by categoryId, type, month, and year', async () => {
      // Create budget for different category
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: otherCategoryId,
        name: 'Entertainment',
        type: 'expense',
      } as any);

      const createDto2: CreateBudgetDto = {
        amount: 300,
        categoryId: otherCategoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      const budget2 = await service.createBudget(createDto2);

      const spent = service.getSpentAmount(budget2.id);

      expect(spent).toBe(75);
    });
  });

  describe('getRemainingBudget', () => {
    beforeEach(async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto);

      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 200,
          categoryId,
          type: 'expense',
          date: '2026-01-15',
          description: 'Transaction 1',
        },
      ] as any);
    });

    it('should calculate remaining budget', () => {
      const remaining = service.getRemainingBudget(1);

      expect(remaining).toBe(300);
    });

    it('should return negative value when overspent', () => {
      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 600,
          categoryId,
          type: 'expense',
          date: '2026-01-15',
          description: 'Transaction 1',
        },
      ] as any);

      const remaining = service.getRemainingBudget(1);

      expect(remaining).toBe(-100);
    });

    it('should return 0 when budget does not exist', () => {
      const remaining = service.getRemainingBudget(999);

      expect(remaining).toBe(0);
    });
  });

  describe('getBudgetWithSpending', () => {
    beforeEach(async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto);
    });

    it('should calculate utilization percentage', () => {
      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 250,
          categoryId,
          type: 'expense',
          date: '2026-01-15',
          description: 'Transaction 1',
        },
      ] as any);

      const result = service.getBudgetWithSpending(1);

      expect(result.utilizationPercentage).toBe(50);
      expect(result.spent).toBe(250);
      expect(result.remaining).toBe(250);
    });

    it('should return 0 utilization when amount is 0', async () => {
      const createDto: CreateBudgetDto = {
        amount: 0,
        categoryId,
        month: 2,
        year: 2026,
        type: 'expense',
      };
      const budget = await service.createBudget(createDto);

      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 100,
          categoryId,
          type: 'expense',
          date: '2026-02-15',
          description: 'Transaction 1',
        },
      ] as any);

      const result = service.getBudgetWithSpending(budget.id);

      expect(result.utilizationPercentage).toBe(0);
    });

    it('should return percentage over 100 when overspent', () => {
      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 750,
          categoryId,
          type: 'expense',
          date: '2026-01-15',
          description: 'Transaction 1',
        },
      ] as any);

      const result = service.getBudgetWithSpending(1);

      expect(result.utilizationPercentage).toBe(150);
    });

    it('should return null when budget does not exist', () => {
      const result = service.getBudgetWithSpending(999);

      expect(result).toBeNull();
    });
  });

  describe('getBudgetWithCategory', () => {
    beforeEach(async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto);
    });

    it('should return budget with category', async () => {
      const result = await service.getBudgetWithCategory(1);

      expect(result).toEqual({
        id: 1,
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
        category: {
          id: categoryId,
          name: 'Groceries',
          type: 'expense',
        },
      });
    });

    it('should return null when budget does not exist', async () => {
      const result = await service.getBudgetWithCategory(999);

      expect(result).toBeNull();
    });

    it('should handle null category', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue(null);

      const result = await service.getBudgetWithCategory(1);

      expect(result.category).toBeNull();
    });
  });

  describe('getBudgetsWithTransactions', () => {
    beforeEach(async () => {
      const createDto: CreateBudgetDto = {
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
      };
      await service.createBudget(createDto);

      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 1,
          amount: 150,
          categoryId,
          type: 'expense',
          date: '2026-01-10',
          description: 'Transaction 1',
        },
        {
          id: 2,
          amount: 100,
          categoryId,
          type: 'expense',
          date: '2026-01-20',
          description: 'Transaction 2',
        },
      ] as any);
    });

    it('should return budget with category, transactions, and calculations', async () => {
      const result = await service.getBudgetsWithTransactions(1);

      expect(result).toEqual({
        id: 1,
        amount: 500,
        categoryId,
        month: 1,
        year: 2026,
        type: 'expense',
        category: {
          id: categoryId,
          name: 'Groceries',
          type: 'expense',
        },
        transactions: [
          {
            id: 1,
            amount: 150,
            categoryId,
            type: 'expense',
            date: '2026-01-10',
            description: 'Transaction 1',
          },
          {
            id: 2,
            amount: 100,
            categoryId,
            type: 'expense',
            date: '2026-01-20',
            description: 'Transaction 2',
          },
        ],
        spent: 250,
        remaining: 250,
        utilizationPercentage: 50,
      });
    });

    it('should return null when budget does not exist', async () => {
      const result = await service.getBudgetsWithTransactions(999);

      expect(result).toBeNull();
    });

    it('should include empty transactions array when no matches', async () => {
      jest.spyOn(transactionsService, 'getAllTransactions').mockReturnValue([
        {
          id: 3,
          amount: 200,
          categoryId: otherCategoryId,
          type: 'expense',
          date: '2026-01-15',
          description: 'Different category',
        },
      ] as any);

      const result = await service.getBudgetsWithTransactions(1);

      expect(result?.transactions).toEqual([]);
      expect(result?.spent).toBe(0);
      expect(result?.utilizationPercentage).toBe(0);
    });
  });
});
