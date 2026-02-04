import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class TransactionsService {
  private transactions: {
    id: number;
    amount: number;
    type: string;
    categoryId: number;
    date: string;
    description: string;
  }[] = [];

  constructor(private categoriesService: CategoriesService) {}

  getAllTransactions() {
    return this.transactions;
  }

  getTransactionById(id: number) {
    return this.transactions.find((transaction) => transaction.id === id);
  }

  createTransaction(createTransactionDto: CreateTransactionDto) {
    // Validate category existence
    const category = this.categoriesService.getCategoryById(
      createTransactionDto.categoryId,
    );
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${createTransactionDto.categoryId} does not exist`,
      );
    }

    const newTransaction = {
      id: this.transactions.length + 1,
      ...createTransactionDto,
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  updateTransaction(id: number, updateTransactionDto: UpdateTransactionDto) {
    // Validate category existence if categoryId is being updated
    if (updateTransactionDto.categoryId !== undefined) {
      const category = this.categoriesService.getCategoryById(
        updateTransactionDto.categoryId,
      );
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateTransactionDto.categoryId} does not exist`,
        );
      }
    }

    const transactionIndex = this.transactions.findIndex(
      (transaction) => transaction.id === id,
    );
    if (transactionIndex > -1) {
      this.transactions[transactionIndex] = {
        ...this.transactions[transactionIndex],
        ...updateTransactionDto,
      };
      return this.transactions[transactionIndex];
    }
    return null;
  }

  deleteTransaction(id: number) {
    const transactionIndex = this.transactions.findIndex(
      (transaction) => transaction.id === id,
    );
    if (transactionIndex > -1) {
      const deletedTransaction = this.transactions.splice(transactionIndex, 1);
      return deletedTransaction[0];
    }
    return null;
  }
}
