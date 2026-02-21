import { Test, TestingModule } from '@nestjs/testing';
import { TransactionType } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../shared/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const mockPrismaService = {
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
});
