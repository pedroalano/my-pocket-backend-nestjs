import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../shared/prisma.service';
import { formatDecimal } from '../shared';

@Injectable()
export class TransactionsService {
  constructor(
    private categoriesService: CategoriesService,
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  private get lang(): string {
    return I18nContext.current()?.lang ?? 'en';
  }

  private mapTransaction(transaction: {
    id: string;
    amount: { toString(): string };
    type: TransactionType;
    categoryId: string;
    date: Date;
    description: string | null;
  }) {
    return {
      ...transaction,
      amount: formatDecimal(transaction.amount),
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
    userId: true,
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
      where: { id },
      select: this.transactionSelect,
    });
    if (!transaction || transaction.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t('transactions.errors.notFound', {
          args: { id },
          lang: this.lang,
        }),
      );
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
        this.i18n.t('transactions.errors.categoryNotFound', {
          args: { id: createTransactionDto.categoryId },
          lang: this.lang,
        }),
      );
    }

    const newTransaction = await this.prisma.transaction.create({
      data: {
        amount: createTransactionDto.amount,
        type: category.type as unknown as TransactionType,
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
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { id },
      select: this.transactionSelect,
    });

    if (!existingTransaction || existingTransaction.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t('transactions.errors.notFound', {
          args: { id },
          lang: this.lang,
        }),
      );
    }

    // Validate category existence if categoryId is being updated
    let newType: TransactionType | undefined;
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
          this.i18n.t('transactions.errors.categoryNotFound', {
            args: { id: updateTransactionDto.categoryId },
            lang: this.lang,
          }),
        );
      }

      newType = category.type as unknown as TransactionType;
    }

    const updatedTransaction = await this.prisma.transaction.update({
      where: { id, userId },
      data: {
        amount: updateTransactionDto.amount,
        type: newType,
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
      where: { id },
      select: this.transactionSelect,
    });

    if (!existingTransaction || existingTransaction.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t('transactions.errors.notFound', {
          args: { id },
          lang: this.lang,
        }),
      );
    }

    const deletedTransaction = await this.prisma.transaction.delete({
      where: { id },
      select: this.transactionSelect,
    });

    return this.mapTransaction(deletedTransaction);
  }
}
