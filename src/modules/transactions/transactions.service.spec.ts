import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { TransactionsService } from './transactions.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../shared/prisma.service';

type TransactionRecord = {
  id: string;
  amount: number;
  type: TransactionType;
  categoryId: string;
  userId: string;
  date: Date;
  description: string | null;
};

const stripUndefined = <T extends Record<string, any>>(value: T) =>
  Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  );

const createPrismaMock = () => {
  let store: TransactionRecord[] = [];
  let idIndex = 0;
  const ids = [
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
  ];

  return {
    transaction: {
      findMany: jest.fn(
        ({ where }) =>
          store.filter((t) => !where?.userId || t.userId === where.userId) ??
          [],
      ),
      findUnique: jest.fn(
        ({ where: { id, userId } }) =>
          store.find(
            (transaction) =>
              transaction.id === id &&
              (!userId || transaction.userId === userId),
          ) ?? null,
      ),
      create: jest.fn(({ data }) => {
        const cleanedData = stripUndefined(data) as Omit<
          TransactionRecord,
          'id'
        >;
        const transaction = {
          id: ids[idIndex++] ?? 'dddddddd-dddd-dddd-dddd-dddddddddddd',
          ...cleanedData,
          description: cleanedData.description ?? null,
        } as TransactionRecord;
        store.push(transaction);
        return transaction;
      }),
      update: jest.fn(({ where, data }) => {
        const { id, userId } = where;
        const transaction = store.find((t) => t.id === id);
        if (!transaction) {
          return null;
        }
        // Check userId to ensure user can only update their own transactions
        if (userId && transaction.userId !== userId) {
          return null;
        }
        const index = store.findIndex((transaction) => transaction.id === id);
        const cleanedData = stripUndefined(data) as Partial<TransactionRecord>;
        const updated = {
          ...store[index],
          ...cleanedData,
        } as TransactionRecord;
        store[index] = updated;
        return updated;
      }),
      delete: jest.fn(({ where: { id } }) => {
        const index = store.findIndex((transaction) => transaction.id === id);
        const [removed] = store.splice(index, 1);
        return removed;
      }),
    },
    __reset: () => {
      store = [];
      idIndex = 0;
    },
  };
};

const buildCategory = (id: string, name: string) => ({
  id,
  name,
  type: 'income',
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
});

describe('TransactionsService', () => {
  let service: TransactionsService;
  let categoriesService: CategoriesService;

  // Test data
  const userId = 'user-123';
  const otherUserId = 'user-456';
  const categoryId = '11111111-1111-1111-1111-111111111111';
  const otherCategoryId = '22222222-2222-2222-2222-222222222222';
  const missingTransactionId = '33333333-3333-3333-3333-333333333333';
  let prismaMock: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prismaMock = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: CategoriesService,
          useValue: {
            getCategoryById: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
    prismaMock.__reset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTransactions', () => {
    it('should return an empty array initially', async () => {
      const transactions = await service.getAllTransactions(userId);
      expect(transactions).toEqual([]);
    });

    it('should return only user transactions filtered by userId', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);
      await service.createTransaction(createDto, userId);
      await service.createTransaction(createDto, otherUserId);

      const userTransactions = await service.getAllTransactions(userId);
      expect(userTransactions.length).toBe(2);

      const otherUserTransactions =
        await service.getAllTransactions(otherUserId);
      expect(otherUserTransactions.length).toBe(1);
    });
  });

  describe('getTransactionById', () => {
    it('should return undefined for non-existent transaction', async () => {
      const transaction = await service.getTransactionById(
        missingTransactionId,
        userId,
      );
      expect(transaction).toBeUndefined();
    });

    it('should return the transaction if it exists and user is owner', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const created = await service.createTransaction(createDto, userId);
      const transaction = await service.getTransactionById(created.id, userId);

      expect(transaction).toBeDefined();
      if (!transaction) {
        throw new Error('Expected transaction to be defined');
      }
      expect(transaction?.id).toBe(created.id);
      expect(transaction.amount).toBe(1000);
      expect(transaction.description).toBe('Monthly salary');
    });

    it('should return undefined when user tries to access another users transaction', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const created = await service.createTransaction(createDto, userId);
      const transaction = await service.getTransactionById(
        created.id,
        otherUserId,
      );

      expect(transaction).toBeUndefined();
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid category and userId', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const transaction = await service.createTransaction(createDto, userId);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBeDefined();
      expect(transaction.amount).toBe(1000);
      expect(transaction.type).toBe(TransactionType.INCOME);
      expect(transaction.categoryId).toBe(categoryId);
      expect(transaction.date).toBe('2025-01-01T00:00:00.000Z');
      expect(transaction.description).toBe('Monthly salary');
    });

    it('should create unique transaction IDs', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const transaction1 = await service.createTransaction(createDto, userId);
      const transaction2 = await service.createTransaction(createDto, userId);

      expect(transaction1.id).not.toBe(transaction2.id);
    });

    it('should throw BadRequestException if category does not exist', async () => {
      jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockRejectedValue(
          new NotFoundException(
            `Category with ID ${otherCategoryId} not found`,
          ),
        );

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: otherCategoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await expect(
        service.createTransaction(createDto, userId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createTransaction(createDto, userId),
      ).rejects.toThrow(`Category with ID ${otherCategoryId} does not exist`);
    });

    it('should persist transaction with userId', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);
      const allTransactions = await service.getAllTransactions(userId);

      expect(allTransactions.length).toBe(1);
      expect(allTransactions[0].amount).toBe(1000);
    });
  });

  describe('updateTransaction', () => {
    beforeEach(async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);
    });

    it('should return null if transaction does not exist', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const result = await service.updateTransaction(
        missingTransactionId,
        updateDto,
        userId,
      );
      expect(result).toBeNull();
    });

    it('should update amount field', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const [existing] = await service.getAllTransactions(userId);
      const updated = await service.updateTransaction(
        existing.id,
        updateDto,
        userId,
      );

      expect(updated).toBeDefined();
      if (!updated) {
        throw new Error('Expected updated transaction to be defined');
      }
      expect(updated.amount).toBe(2000);
      expect(updated.description).toBe('Monthly salary');
      expect(updated.categoryId).toBe(categoryId);
    });

    it('should update multiple fields', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
        description: 'Bonus payment',
        type: 'expense',
      };

      const [existing] = await service.getAllTransactions(userId);
      const updated = await service.updateTransaction(
        existing.id,
        updateDto,
        userId,
      );

      if (!updated) {
        throw new Error('Expected updated transaction to be defined');
      }
      expect(updated.amount).toBe(2000);
      expect(updated.description).toBe('Bonus payment');
      expect(updated.type).toBe(TransactionType.EXPENSE);
      expect(updated.date).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should validate category when updating categoryId', async () => {
      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);

      jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockRejectedValue(
          new NotFoundException(
            `Category with ID ${otherCategoryId} not found`,
          ),
        );

      const updateDto: UpdateTransactionDto = {
        categoryId: otherCategoryId,
      };

      const [existing] = await service.getAllTransactions(userId);

      await expect(
        service.updateTransaction(existing.id, updateDto, userId),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateTransaction(existing.id, updateDto, userId),
      ).rejects.toThrow(`Category with ID ${otherCategoryId} does not exist`);
    });

    it('should not validate category if categoryId is not being updated', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const [existing] = await service.getAllTransactions(userId);
      const updated = await service.updateTransaction(
        existing.id,
        updateDto,
        userId,
      );

      expect(updated).toBeDefined();
      if (!updated) {
        throw new Error('Expected updated transaction to be defined');
      }
      expect(updated.amount).toBe(2000);
      expect(
        (categoriesService.getCategoryById as jest.Mock).mock.calls.length,
      ).toBe(1); // Only called during create
    });

    it('should update category if new category exists', async () => {
      jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValueOnce({
          ...buildCategory(categoryId, 'Salary'),
        })
        .mockResolvedValueOnce({
          ...buildCategory(otherCategoryId, 'Bonus'),
        });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);

      const updateDto: UpdateTransactionDto = {
        categoryId: otherCategoryId,
      };

      const [existing] = await service.getAllTransactions(userId);
      const updated = await service.updateTransaction(
        existing.id,
        updateDto,
        userId,
      );

      if (!updated) {
        throw new Error('Expected updated transaction to be defined');
      }
      expect(updated.categoryId).toBe(otherCategoryId);
    });

    it('should return null when user tries to update another users transaction', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 5000,
      };

      const [existing] = await service.getAllTransactions(userId);
      const result = await service.updateTransaction(
        existing.id,
        updateDto,
        otherUserId,
      );

      expect(result).toBeNull();

      // Verify the original transaction wasn't modified
      const originalTransaction = await service.getTransactionById(
        existing.id,
        userId,
      );
      expect(originalTransaction?.amount).toBe(1000);
    });
  });

  describe('deleteTransaction', () => {
    beforeEach(async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);
    });

    it('should return null if transaction does not exist', async () => {
      const result = await service.deleteTransaction(
        missingTransactionId,
        userId,
      );
      expect(result).toBeNull();
    });

    it('should delete a transaction and return it', async () => {
      const [existing] = await service.getAllTransactions(userId);
      const deleted = await service.deleteTransaction(existing.id, userId);

      expect(deleted).toBeDefined();
      if (!deleted) {
        throw new Error('Expected deleted transaction to be defined');
      }
      expect(deleted.id).toBe(existing.id);
      expect(deleted.amount).toBe(1000);
    });

    it('should remove transaction from array', async () => {
      const [existing] = await service.getAllTransactions(userId);
      await service.deleteTransaction(existing.id, userId);
      const remaining = await service.getAllTransactions(userId);

      expect(remaining.length).toBe(0);
    });

    it('should remove only the specified transaction', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        ...buildCategory(categoryId, 'Salary'),
      });

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto, userId);

      const [first] = await service.getAllTransactions(userId);
      await service.deleteTransaction(first.id, userId);
      const remaining = await service.getAllTransactions(userId);

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).not.toBe(first.id);
    });

    it('should return null when user tries to delete another users transaction', async () => {
      const [existing] = await service.getAllTransactions(userId);
      const result = await service.deleteTransaction(existing.id, otherUserId);

      expect(result).toBeNull();
    });
  });
});
