import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  const mockUserId = 'user-123';
  const mockAuthenticatedRequest = {
    user: {
      userId: mockUserId,
      email: 'test@example.com',
      name: 'Test User',
    },
  } as unknown as AuthenticatedRequest;

  beforeEach(async () => {
    const mockDashboardService = {
      getMonthlySummary: jest.fn(),
      getBudgetVsActual: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: mockDashboardService,
        },
      ],
    }).compile();

    controller = module.get<DashboardController>(DashboardController);
    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMonthlySummary', () => {
    it('should return monthly summary for valid month and year', async () => {
      const expectedResult = {
        totalIncome: 5000,
        totalExpense: 2000,
        balance: 3000,
      };

      jest
        .spyOn(service, 'getMonthlySummary')
        .mockResolvedValue(expectedResult);

      const result = await controller.getMonthlySummary(
        mockAuthenticatedRequest,
        2,
        2026,
      );

      expect(result).toEqual(expectedResult);
      expect(service.getMonthlySummary).toHaveBeenCalledWith(
        mockUserId,
        2,
        2026,
      );
    });

    it('should throw BadRequestException for invalid month (0)', async () => {
      await expect(
        controller.getMonthlySummary(mockAuthenticatedRequest, 0, 2026),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid month (13)', async () => {
      await expect(
        controller.getMonthlySummary(mockAuthenticatedRequest, 13, 2026),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept month 1 (January)', async () => {
      const expectedResult = {
        totalIncome: 1000,
        totalExpense: 500,
        balance: 500,
      };

      jest
        .spyOn(service, 'getMonthlySummary')
        .mockResolvedValue(expectedResult);

      const result = await controller.getMonthlySummary(
        mockAuthenticatedRequest,
        1,
        2026,
      );

      expect(result).toEqual(expectedResult);
      expect(service.getMonthlySummary).toHaveBeenCalledWith(
        mockUserId,
        1,
        2026,
      );
    });

    it('should accept month 12 (December)', async () => {
      const expectedResult = {
        totalIncome: 2000,
        totalExpense: 1000,
        balance: 1000,
      };

      jest
        .spyOn(service, 'getMonthlySummary')
        .mockResolvedValue(expectedResult);

      const result = await controller.getMonthlySummary(
        mockAuthenticatedRequest,
        12,
        2026,
      );

      expect(result).toEqual(expectedResult);
      expect(service.getMonthlySummary).toHaveBeenCalledWith(
        mockUserId,
        12,
        2026,
      );
    });

    it('should return zero values when no transactions exist', async () => {
      const expectedResult = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };

      jest
        .spyOn(service, 'getMonthlySummary')
        .mockResolvedValue(expectedResult);

      const result = await controller.getMonthlySummary(
        mockAuthenticatedRequest,
        3,
        2026,
      );

      expect(result).toEqual(expectedResult);
    });

    it('should use userId from authenticated request', async () => {
      jest.spyOn(service, 'getMonthlySummary').mockResolvedValue({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      });

      await controller.getMonthlySummary(mockAuthenticatedRequest, 6, 2026);

      expect(service.getMonthlySummary).toHaveBeenCalledWith(
        mockUserId,
        6,
        2026,
      );
    });
  });

  describe('getBudgetVsActual', () => {
    it('should return budget vs actual comparison for valid month and year', async () => {
      const expectedResult = [
        {
          category: { id: 'cat-1', name: 'Food', type: 'EXPENSE' },
          budgetAmount: 1000,
          actualAmount: 500,
          difference: 500,
          percentageUsed: 50,
        },
      ];

      jest
        .spyOn(service, 'getBudgetVsActual')
        .mockResolvedValue(expectedResult as any);

      const result = await controller.getBudgetVsActual(
        mockAuthenticatedRequest,
        2,
        2026,
      );

      expect(result).toEqual(expectedResult);
      expect(service.getBudgetVsActual).toHaveBeenCalledWith(
        mockUserId,
        2,
        2026,
      );
    });

    it('should throw BadRequestException for invalid month (0)', async () => {
      await expect(
        controller.getBudgetVsActual(mockAuthenticatedRequest, 0, 2026),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid month (13)', async () => {
      await expect(
        controller.getBudgetVsActual(mockAuthenticatedRequest, 13, 2026),
      ).rejects.toThrow(BadRequestException);
    });

    it('should use userId from authenticated request', async () => {
      jest.spyOn(service, 'getBudgetVsActual').mockResolvedValue([]);

      await controller.getBudgetVsActual(mockAuthenticatedRequest, 6, 2026);

      expect(service.getBudgetVsActual).toHaveBeenCalledWith(
        mockUserId,
        6,
        2026,
      );
    });
  });
});
