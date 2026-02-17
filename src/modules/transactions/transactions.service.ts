import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(
    private categoriesService: CategoriesService,
    private prisma: PrismaService,
  ) {}

  private normalizeTransactionType(type: string): TransactionType {
    const normalized = type?.toUpperCase();
    if (normalized === TransactionType.INCOME) {
      return TransactionType.INCOME;
    }
    if (normalized === TransactionType.EXPENSE) {
      return TransactionType.EXPENSE;
    }
    throw new BadRequestException(`Invalid transaction type: ${type}`);
  }

  private mapTransaction(transaction: {
    id: string;
    amount: any;
    type: TransactionType;
    categoryId: string;
    date: Date;
    description: string | null;
  }) {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      date: transaction.date.toISOString(),
    };
  }

  private readonly transactionSelect = {
    id: true,
    amount: true,
    type: true,
    categoryId: true,
    date: true,
    description: true,
  };

  async getAllTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: this.transactionSelect,
    });
    return transactions.map((transaction) => this.mapTransaction(transaction));
  }

  async getTransactionById(id: string, userId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id, userId },
      select: this.transactionSelect,
    });
    if (!transaction) {
      return undefined;
    }
    return this.mapTransaction(transaction);
  }

  async createTransaction(
    createTransactionDto: CreateTransactionDto,
    userId: string,
  ) {
    // Validate category existence
    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        createTransactionDto.categoryId,
        userId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    if (!category) {
      throw new BadRequestException(
        `Category with ID ${createTransactionDto.categoryId} does not exist`,
      );
    }

    const newTransaction = await this.prisma.transaction.create({
      data: {
        amount: createTransactionDto.amount,
        type: this.normalizeTransactionType(createTransactionDto.type),
        categoryId: createTransactionDto.categoryId,
        date: new Date(createTransactionDto.date),
        description: createTransactionDto.description,
        userId,
      },
      select: this.transactionSelect,
    });
    return this.mapTransaction(newTransaction);
  }

  async updateTransaction(
    id: string,
    updateTransactionDto: UpdateTransactionDto,
    userId: string,
  ) {
    // Validate category existence if categoryId is being updated
    if (updateTransactionDto.categoryId !== undefined) {
      let category = null;

      try {
        category = await this.categoriesService.getCategoryById(
          updateTransactionDto.categoryId,
          userId,
        );
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }

      if (!category) {
        throw new BadRequestException(
          `Category with ID ${updateTransactionDto.categoryId} does not exist`,
        );
      }
    }

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: this.transactionSelect,
    });

    if (!existingTransaction) {
      return null;
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        amount: updateTransactionDto.amount,
        type:
          updateTransactionDto.type !== undefined
            ? this.normalizeTransactionType(updateTransactionDto.type)
            : undefined,
        categoryId: updateTransactionDto.categoryId,
        date:
          updateTransactionDto.date !== undefined
            ? new Date(updateTransactionDto.date)
            : undefined,
        description: updateTransactionDto.description,
      },
      select: this.transactionSelect,
    });

    return this.mapTransaction(updatedTransaction);
  }

  async deleteTransaction(id: string, userId: string) {
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { id, userId },
      select: this.transactionSelect,
    });

    if (!existingTransaction) {
      return null;
    }

    const deletedTransaction = await this.prisma.transaction.delete({
      where: { id },
      select: this.transactionSelect,
    });

    return this.mapTransaction(deletedTransaction);
  }
}
