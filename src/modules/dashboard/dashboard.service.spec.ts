import { Test, TestingModule } from '@nestjs/testing';
import { CategoryType, TransactionType } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../shared/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const mockPrismaService = {
      budget: {
        findMany: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonthlySummary', () => {
    it('should return correct totals with transactions', async () => {
      const transactions = [
        {
          amount: { toNumber: () => 1000 },
          type: TransactionType.INCOME,
        },
        {
          amount: { toNumber: () => 500 },
          type: TransactionType.INCOME,
        },
        {
          amount: { toNumber: () => 300 },
          type: TransactionType.EXPENSE,
        },
        {
          amount: { toNumber: () => 200 },
          type: TransactionType.EXPENSE,
        },
      ];

      // Convert to the format expected by the service
      const formattedTransactions = transactions.map((t) => ({
        amount: t.amount.toNumber ? t.amount.toNumber() : t.amount,
        type: t.type,
      }));

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(formattedTransactions as any);

      const result = await service.getMonthlySummary(mockUserId, 2, 2026);

      expect(result).toEqual({
        totalIncome: 1500,
        totalExpense: 500,
        balance: 1000,
      });
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          date: {
            gte: new Date(Date.UTC(2026, 1, 1, 0, 0, 0, 0)),
            lt: new Date(Date.UTC(2026, 2, 1, 0, 0, 0, 0)),
          },
        },
        select: {
          amount: true,
          type: true,
        },
      });
    });

    it('should return zero values when no transactions exist', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.getMonthlySummary(mockUserId, 1, 2026);

      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });
    });

    it('should handle only income transactions', async () => {
      const transactions = [
        { amount: 500, type: TransactionType.INCOME },
        { amount: 1000, type: TransactionType.INCOME },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getMonthlySummary(mockUserId, 3, 2026);

      expect(result).toEqual({
        totalIncome: 1500,
        totalExpense: 0,
        balance: 1500,
      });
    });

    it('should handle only expense transactions', async () => {
      const transactions = [
        { amount: 250, type: TransactionType.EXPENSE },
        { amount: 150, type: TransactionType.EXPENSE },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getMonthlySummary(mockUserId, 6, 2026);

      expect(result).toEqual({
        totalIncome: 0,
        totalExpense: 400,
        balance: -400,
      });
    });

    it('should filter transactions by userId', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      await service.getMonthlySummary(mockUserId, 12, 2026);

      const callArgs = (prismaService.transaction.findMany as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.where.userId).toBe(mockUserId);
    });

    it('should calculate correct date range for February', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      await service.getMonthlySummary(mockUserId, 2, 2026);

      const callArgs = (prismaService.transaction.findMany as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.where.date.gte).toEqual(
        new Date(Date.UTC(2026, 1, 1, 0, 0, 0, 0)),
      );
      expect(callArgs.where.date.lt).toEqual(
        new Date(Date.UTC(2026, 2, 1, 0, 0, 0, 0)),
      );
    });

    it('should calculate balance as totalIncome minus totalExpense', async () => {
      const transactions = [
        { amount: 5000, type: TransactionType.INCOME },
        { amount: 2000, type: TransactionType.EXPENSE },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getMonthlySummary(mockUserId, 5, 2026);

      expect(result.balance).toBe(result.totalIncome - result.totalExpense);
      expect(result.balance).toBe(3000);
    });
  });

  describe('getBudgetVsActual', () => {
    it('should return comparison for budgets and categories without budgets', async () => {
      const budgets = [
        {
          amount: 1000,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 500,
          categoryId: 'cat-2',
          category: { id: 'cat-2', name: 'Rent', type: CategoryType.EXPENSE },
        },
      ];

      const transactions = [
        {
          amount: 200,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 300,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 400,
          categoryId: 'cat-3',
          category: { id: 'cat-3', name: 'Travel', type: CategoryType.EXPENSE },
        },
      ];

      jest
        .spyOn(prismaService.budget, 'findMany')
        .mockResolvedValue(budgets as any);
      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getBudgetVsActual(mockUserId, 2, 2026);

      expect(result).toHaveLength(3);

      const food = result.find((item) => item.category.id === 'cat-1');
      expect(food).toEqual({
        category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        budgetAmount: 1000,
        actualAmount: 500,
        difference: 500,
        percentageUsed: 50,
      });

      const rent = result.find((item) => item.category.id === 'cat-2');
      expect(rent).toEqual({
        category: { id: 'cat-2', name: 'Rent', type: CategoryType.EXPENSE },
        budgetAmount: 500,
        actualAmount: 0,
        difference: 500,
        percentageUsed: 0,
      });

      const travel = result.find((item) => item.category.id === 'cat-3');
      expect(travel).toEqual({
        category: { id: 'cat-3', name: 'Travel', type: CategoryType.EXPENSE },
        budgetAmount: 0,
        actualAmount: 400,
        difference: -400,
        percentageUsed: 100,
      });

      expect(prismaService.budget.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, month: 2, year: 2026 },
        select: {
          amount: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          date: {
            gte: new Date(Date.UTC(2026, 1, 1, 0, 0, 0, 0)),
            lt: new Date(Date.UTC(2026, 2, 1, 0, 0, 0, 0)),
          },
        },
        select: {
          amount: true,
          categoryId: true,
          category: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    });

    it('should return empty list when no budgets or transactions exist', async () => {
      jest.spyOn(prismaService.budget, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.getBudgetVsActual(mockUserId, 1, 2026);

      expect(result).toEqual([]);
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return categories grouped with correct amounts and percentages', async () => {
      const transactions = [
        {
          amount: 500,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 300,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 200,
          categoryId: 'cat-2',
          category: {
            id: 'cat-2',
            name: 'Transport',
            type: CategoryType.EXPENSE,
          },
        },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getCategoryBreakdown(mockUserId, 3, 2026);

      expect(result).toHaveLength(2);

      const food = result.find((item) => item.category.id === 'cat-1');
      expect(food).toEqual({
        category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        totalAmount: 800,
        percentage: 80,
      });

      const transport = result.find((item) => item.category.id === 'cat-2');
      expect(transport).toEqual({
        category: {
          id: 'cat-2',
          name: 'Transport',
          type: CategoryType.EXPENSE,
        },
        totalAmount: 200,
        percentage: 20,
      });
    });

    it('should return empty array when no transactions exist', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.getCategoryBreakdown(mockUserId, 4, 2026);

      expect(result).toEqual([]);
    });

    it('should filter only EXPENSE transactions', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      await service.getCategoryBreakdown(mockUserId, 2, 2026);

      const callArgs = (prismaService.transaction.findMany as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.where.type).toBe(TransactionType.EXPENSE);
      expect(callArgs.where.userId).toBe(mockUserId);
    });

    it('should filter transactions by month and year range', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      await service.getCategoryBreakdown(mockUserId, 5, 2026);

      const callArgs = (prismaService.transaction.findMany as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.where.date.gte).toEqual(
        new Date(Date.UTC(2026, 4, 1, 0, 0, 0, 0)),
      );
      expect(callArgs.where.date.lt).toEqual(
        new Date(Date.UTC(2026, 5, 1, 0, 0, 0, 0)),
      );
    });

    it('should calculate percentage as 0 when grand total is 0', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      const result = await service.getCategoryBreakdown(mockUserId, 1, 2026);

      expect(result).toEqual([]);
    });

    it('should handle single category', async () => {
      const transactions = [
        {
          amount: 500,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 250,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getCategoryBreakdown(mockUserId, 6, 2026);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        totalAmount: 750,
        percentage: 100,
      });
    });

    it('should group multiple transactions from same category correctly', async () => {
      const transactions = [
        {
          amount: 100,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 150,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 200,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getCategoryBreakdown(mockUserId, 7, 2026);

      expect(result).toHaveLength(1);
      expect(result[0].totalAmount).toBe(450);
      expect(result[0].percentage).toBe(100);
    });

    it('should calculate correct percentages with multiple categories', async () => {
      const transactions = [
        {
          amount: 600,
          categoryId: 'cat-1',
          category: { id: 'cat-1', name: 'Food', type: CategoryType.EXPENSE },
        },
        {
          amount: 300,
          categoryId: 'cat-2',
          category: {
            id: 'cat-2',
            name: 'Transport',
            type: CategoryType.EXPENSE,
          },
        },
        {
          amount: 100,
          categoryId: 'cat-3',
          category: {
            id: 'cat-3',
            name: 'Entertainment',
            type: CategoryType.EXPENSE,
          },
        },
      ];

      jest
        .spyOn(prismaService.transaction, 'findMany')
        .mockResolvedValue(transactions as any);

      const result = await service.getCategoryBreakdown(mockUserId, 8, 2026);

      expect(result).toHaveLength(3);
      expect(result.find((r) => r.category.id === 'cat-1')?.percentage).toBe(
        60,
      );
      expect(result.find((r) => r.category.id === 'cat-2')?.percentage).toBe(
        30,
      );
      expect(result.find((r) => r.category.id === 'cat-3')?.percentage).toBe(
        10,
      );
    });

    it('should ensure user isolation by filtering on userId', async () => {
      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);

      const differentUserId = 'user-456';
      await service.getCategoryBreakdown(differentUserId, 2, 2026);

      const callArgs = (prismaService.transaction.findMany as jest.Mock).mock
        .calls[0][0];
      expect(callArgs.where.userId).toBe(differentUserId);
    });
  });
});
