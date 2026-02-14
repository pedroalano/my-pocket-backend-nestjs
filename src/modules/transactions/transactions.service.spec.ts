import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let categoriesService: CategoriesService;
  const categoryId = '11111111-1111-1111-1111-111111111111';
  const otherCategoryId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: CategoriesService,
          useValue: {
            getCategoryById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    categoriesService = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllTransactions', () => {
    it('should return an empty array initially', () => {
      const transactions = service.getAllTransactions();
      expect(transactions).toEqual([]);
    });

    it('should return all transactions after creating some', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto);
      await service.createTransaction(createDto);

      const transactions = service.getAllTransactions();
      expect(transactions.length).toBe(2);
    });
  });

  describe('getTransactionById', () => {
    it('should return undefined for non-existent transaction', () => {
      const transaction = service.getTransactionById(999);
      expect(transaction).toBeUndefined();
    });

    it('should return the transaction if it exists', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto);
      const transaction = service.getTransactionById(1);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(1);
      expect(transaction.amount).toBe(1000);
      expect(transaction.description).toBe('Monthly salary');
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid category', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const transaction = await service.createTransaction(createDto);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(1);
      expect(transaction.amount).toBe(1000);
      expect(transaction.type).toBe('income');
      expect(transaction.categoryId).toBe(categoryId);
      expect(transaction.date).toBe('2025-01-01');
      expect(transaction.description).toBe('Monthly salary');
    });

    it('should auto-increment transaction IDs', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const transaction1 = await service.createTransaction(createDto);
      const transaction2 = await service.createTransaction(createDto);

      expect(transaction1.id).toBe(1);
      expect(transaction2.id).toBe(2);
    });

    it('should throw BadRequestException if category does not exist', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue(null);

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
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto);
      const allTransactions = service.getAllTransactions();

      expect(allTransactions.length).toBe(1);
      expect(allTransactions[0].amount).toBe(1000);
    });
  });

  describe('updateTransaction', () => {
    beforeEach(async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

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

      const result = await service.updateTransaction(999, updateDto);
      expect(result).toBeNull();
    });

    it('should update amount field', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const updated = await service.updateTransaction(1, updateDto);

      expect(updated).toBeDefined();
      expect(updated.amount).toBe(2000);
      expect(updated.description).toBe('Monthly salary');
      expect(updated.categoryId).toBe(categoryId);
    });

    it('should update multiple fields', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
        description: 'Bonus payment',
        type: 'bonus',
      };

      const updated = await service.updateTransaction(1, updateDto);

      expect(updated.amount).toBe(2000);
      expect(updated.description).toBe('Bonus payment');
      expect(updated.type).toBe('bonus');
      expect(updated.date).toBe('2025-01-01');
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
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue(null);

      const updateDto: UpdateTransactionDto = {
        categoryId: otherCategoryId,
      };

      await expect(service.updateTransaction(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.updateTransaction(1, updateDto)).rejects.toThrow(
        `Category with ID ${otherCategoryId} does not exist`,
      );
    });

    it('should not validate category if categoryId is not being updated', async () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const updated = await service.updateTransaction(1, updateDto);

      expect(updated).toBeDefined();
      expect(updated.amount).toBe(2000);
      expect(categoriesService.getCategoryById).toHaveBeenCalledTimes(1); // Only called during create
    });

    it('should update category if new category exists', async () => {
      jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockResolvedValueOnce({
          id: categoryId,
          name: 'Salary',
          type: 'income',
        } as any)
        .mockResolvedValueOnce({
          id: otherCategoryId,
          name: 'Bonus',
          type: 'income',
        } as any);

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

      const updated = await service.updateTransaction(1, updateDto);

      expect(updated.categoryId).toBe(otherCategoryId);
    });
  });

  describe('deleteTransaction', () => {
    beforeEach(async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto);
    });

    it('should return null if transaction does not exist', () => {
      const result = service.deleteTransaction(999);
      expect(result).toBeNull();
    });

    it('should delete a transaction and return it', () => {
      const deleted = service.deleteTransaction(1);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(1);
      expect(deleted.amount).toBe(1000);
    });

    it('should remove transaction from array', () => {
      service.deleteTransaction(1);
      const remaining = service.getAllTransactions();

      expect(remaining.length).toBe(0);
    });

    it('should remove only the specified transaction', async () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockResolvedValue({
        id: categoryId,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      await service.createTransaction(createDto);

      service.deleteTransaction(1);
      const remaining = service.getAllTransactions();

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(2);
    });
  });
});
