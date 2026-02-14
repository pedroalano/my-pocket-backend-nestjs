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
      findMany: jest.fn(() => store),
      findUnique: jest.fn(
        ({ where: { id } }) =>
          store.find((transaction) => transaction.id === id) ?? null,
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
      update: jest.fn(({ where: { id }, data }) => {
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
      const transactions = await service.getAllTransactions();
      expect(transactions).toEqual([]);
    });

    it('should return all transactions after creating some', async () => {
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

      await service.createTransaction(createDto);
      await service.createTransaction(createDto);

      const transactions = await service.getAllTransactions();
      expect(transactions.length).toBe(2);
    });
  });

  describe('getTransactionById', () => {
    it('should return undefined for non-existent transaction', async () => {
      const transaction =
        await service.getTransactionById(missingTransactionId);
      expect(transaction).toBeUndefined();
    });

    it('should return the transaction if it exists', async () => {
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

      const created = await service.createTransaction(createDto);
      const transaction = await service.getTransactionById(created.id);

      expect(transaction).toBeDefined();
      if (!transaction) {
        throw new Error('Expected transaction to be defined');
      }
      expect(transaction?.id).toBe(created.id);
      expect(transaction.amount).toBe(1000);
      expect(transaction.description).toBe('Monthly salary');
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid category', async () => {
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

      const transaction = await service.createTransaction(createDto);

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

      const transaction1 = await service.createTransaction(createDto);
      const transaction2 = await service.createTransaction(createDto);

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

      await expect(service.createTransaction(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createTransaction(createDto)).rejects.toThrow(
        `Category with ID ${otherCategoryId} does not exist`,
      );
    });

    it('should persist transaction in memory', async () => {
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

      await service.createTransaction(createDto);
      const allTransactions = await service.getAllTransactions();

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

      await service.createTransaction(createDto);
    });

    it('should return null if transaction does not exist', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const result = await service.updateTransaction(
        missingTransactionId,
        updateDto,
      );
      expect(result).toBeNull();
    });

    it('should update amount field', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const [existing] = await service.getAllTransactions();
      const updated = await service.updateTransaction(existing.id, updateDto);

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

      const [existing] = await service.getAllTransactions();
      const updated = await service.updateTransaction(existing.id, updateDto);

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

      await service.createTransaction(createDto);

      // Mock the method to return null for invalid category
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

      const [existing] = await service.getAllTransactions();

      await expect(
        service.updateTransaction(existing.id, updateDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateTransaction(existing.id, updateDto),
      ).rejects.toThrow(`Category with ID ${otherCategoryId} does not exist`);
    });

    it('should not validate category if categoryId is not being updated', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const [existing] = await service.getAllTransactions();
      const updated = await service.updateTransaction(existing.id, updateDto);

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

      await service.createTransaction(createDto);

      const updateDto: UpdateTransactionDto = {
        categoryId: otherCategoryId,
      };

      const [existing] = await service.getAllTransactions();
      const updated = await service.updateTransaction(existing.id, updateDto);

      if (!updated) {
        throw new Error('Expected updated transaction to be defined');
      }
      expect(updated.categoryId).toBe(otherCategoryId);
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

      await service.createTransaction(createDto);
    });

    it('should return null if transaction does not exist', async () => {
      const result = await service.deleteTransaction(missingTransactionId);
      expect(result).toBeNull();
    });

    it('should delete a transaction and return it', async () => {
      const [existing] = await service.getAllTransactions();
      const deleted = await service.deleteTransaction(existing.id);

      expect(deleted).toBeDefined();
      if (!deleted) {
        throw new Error('Expected deleted transaction to be defined');
      }
      expect(deleted.id).toBe(existing.id);
      expect(deleted.amount).toBe(1000);
    });

    it('should remove transaction from array', async () => {
      const [existing] = await service.getAllTransactions();
      await service.deleteTransaction(existing.id);
      const remaining = await service.getAllTransactions();

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

      await service.createTransaction(createDto);

      const [first] = await service.getAllTransactions();
      await service.deleteTransaction(first.id);
      const remaining = await service.getAllTransactions();

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).not.toBe(first.id);
    });
  });
});
