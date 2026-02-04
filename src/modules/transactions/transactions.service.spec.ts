import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CategoriesService } from '../categories/categories.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let categoriesService: CategoriesService;

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

    it('should return all transactions after creating some', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);
      service.createTransaction(createDto);

      const transactions = service.getAllTransactions();
      expect(transactions.length).toBe(2);
    });
  });

  describe('getTransactionById', () => {
    it('should return undefined for non-existent transaction', () => {
      const transaction = service.getTransactionById(999);
      expect(transaction).toBeUndefined();
    });

    it('should return the transaction if it exists', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);
      const transaction = service.getTransactionById(1);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(1);
      expect(transaction.amount).toBe(1000);
      expect(transaction.description).toBe('Monthly salary');
    });
  });

  describe('createTransaction', () => {
    it('should create a transaction with valid category', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const transaction = service.createTransaction(createDto);

      expect(transaction).toBeDefined();
      expect(transaction.id).toBe(1);
      expect(transaction.amount).toBe(1000);
      expect(transaction.type).toBe('income');
      expect(transaction.categoryId).toBe(1);
      expect(transaction.date).toBe('2025-01-01');
      expect(transaction.description).toBe('Monthly salary');
    });

    it('should auto-increment transaction IDs', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      const transaction1 = service.createTransaction(createDto);
      const transaction2 = service.createTransaction(createDto);

      expect(transaction1.id).toBe(1);
      expect(transaction2.id).toBe(2);
    });

    it('should throw BadRequestException if category does not exist', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue(null);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 999,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      expect(() => service.createTransaction(createDto)).toThrow(
        BadRequestException,
      );
      expect(() => service.createTransaction(createDto)).toThrow(
        `Category with ID 999 does not exist`,
      );
    });

    it('should persist transaction in memory', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);
      const allTransactions = service.getAllTransactions();

      expect(allTransactions.length).toBe(1);
      expect(allTransactions[0].amount).toBe(1000);
    });
  });

  describe('updateTransaction', () => {
    beforeEach(() => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);
    });

    it('should return null if transaction does not exist', () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const result = service.updateTransaction(999, updateDto);
      expect(result).toBeNull();
    });

    it('should update amount field', () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const updated = service.updateTransaction(1, updateDto);

      expect(updated).toBeDefined();
      expect(updated.amount).toBe(2000);
      expect(updated.description).toBe('Monthly salary');
      expect(updated.categoryId).toBe(1);
    });

    it('should update multiple fields', () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
        description: 'Bonus payment',
        type: 'bonus',
      };

      const updated = service.updateTransaction(1, updateDto);

      expect(updated.amount).toBe(2000);
      expect(updated.description).toBe('Bonus payment');
      expect(updated.type).toBe('bonus');
      expect(updated.date).toBe('2025-01-01');
    });

    it('should validate category when updating categoryId', () => {
      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);

      // Mock the method to return null for invalid category
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue(null);

      const updateDto: UpdateTransactionDto = {
        categoryId: 999,
      };

      expect(() => service.updateTransaction(1, updateDto)).toThrow(
        BadRequestException,
      );
      expect(() => service.updateTransaction(1, updateDto)).toThrow(
        `Category with ID 999 does not exist`,
      );
    });

    it('should not validate category if categoryId is not being updated', () => {
      const updateDto: UpdateTransactionDto = {
        amount: 2000,
      };

      const updated = service.updateTransaction(1, updateDto);

      expect(updated).toBeDefined();
      expect(updated.amount).toBe(2000);
      expect(categoriesService.getCategoryById).toHaveBeenCalledTimes(1); // Only called during create
    });

    it('should update category if new category exists', () => {
      jest
        .spyOn(categoriesService, 'getCategoryById')
        .mockReturnValueOnce({
          id: 1,
          name: 'Salary',
          type: 'income',
        } as any)
        .mockReturnValueOnce({
          id: 2,
          name: 'Bonus',
          type: 'income',
        } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);

      const updateDto: UpdateTransactionDto = {
        categoryId: 2,
      };

      const updated = service.updateTransaction(1, updateDto);

      expect(updated.categoryId).toBe(2);
    });
  });

  describe('deleteTransaction', () => {
    beforeEach(() => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);
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

    it('should remove only the specified transaction', () => {
      jest.spyOn(categoriesService, 'getCategoryById').mockReturnValue({
        id: 1,
        name: 'Salary',
        type: 'income',
      } as any);

      const createDto: CreateTransactionDto = {
        amount: 1000,
        type: 'income',
        categoryId: 1,
        date: '2025-01-01',
        description: 'Monthly salary',
      };

      service.createTransaction(createDto);

      service.deleteTransaction(1);
      const remaining = service.getAllTransactions();

      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(2);
    });
  });
});
