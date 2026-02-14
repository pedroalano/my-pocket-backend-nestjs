import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetType, Prisma, TransactionType } from '@prisma/client';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../shared/prisma.service';

type BudgetWithSpending = {
  id: string;
  amount: number;
  categoryId: string;
  month: number;
  year: number;
  type: BudgetType;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
};

@Injectable()
export class BudgetService {
  constructor(
    private categoriesService: CategoriesService,
    private prisma: PrismaService,
  ) {}

  private readonly budgetSelect = {
    id: true,
    amount: true,
    categoryId: true,
    month: true,
    year: true,
    type: true,
  };

  private readonly transactionSelect = {
    id: true,
    amount: true,
    categoryId: true,
    type: true,
    date: true,
    description: true,
  };

  private normalizeBudgetType(type: string): BudgetType {
    const normalized = type?.toUpperCase();

    if (normalized === BudgetType.EXPENSE) {
      return BudgetType.EXPENSE;
    }

    if (normalized === BudgetType.SAVINGS) {
      return BudgetType.SAVINGS;
    }

    throw new BadRequestException(`Invalid budget type: ${type}`);
  }

  private mapBudget(budget: {
    id: string;
    amount: any;
    categoryId: string;
    month: number;
    year: number;
    type: BudgetType;
  }) {
    return {
      ...budget,
      amount: Number(budget.amount),
    };
  }

  private mapTransaction(transaction: {
    id: string;
    amount: any;
    categoryId: string;
    type: TransactionType;
    date: Date;
    description: string | null;
  }) {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      date: transaction.date.toISOString(),
    };
  }

  private getMonthRange(month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    return { start, end };
  }

  private getTransactionTypeForBudget(type: BudgetType): TransactionType {
    if (type === BudgetType.EXPENSE) {
      return TransactionType.EXPENSE;
    }

    return TransactionType.INCOME;
  }

  private async calculateSpentAmount(budget: {
    categoryId: string;
    month: number;
    year: number;
    type: BudgetType;
  }) {
    const { start, end } = this.getMonthRange(budget.month, budget.year);
    const transactionType = this.getTransactionTypeForBudget(budget.type);
    const spent = await this.prisma.transaction.aggregate({
      where: {
        categoryId: budget.categoryId,
        type: transactionType,
        date: {
          gte: start,
          lt: end,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return Number(spent._sum.amount ?? 0);
  }

  async getAllBudgets() {
    const budgets = await this.prisma.budget.findMany({
      select: this.budgetSelect,
    });
    return budgets.map((budget) => this.mapBudget(budget));
  }

  async getBudgetById(id: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: this.budgetSelect,
    });

    if (!budget) {
      return undefined;
    }

    return this.mapBudget(budget);
  }

  async createBudget(budgetData: CreateBudgetDto) {
    this.validateBudgetData(budgetData);

    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        budgetData.categoryId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${budgetData.categoryId} does not exist`,
      );
    }

    try {
      const newBudget = await this.prisma.budget.create({
        data: {
          amount: budgetData.amount,
          categoryId: budgetData.categoryId,
          month: budgetData.month,
          year: budgetData.year,
          type: this.normalizeBudgetType(budgetData.type),
        },
        select: this.budgetSelect,
      });
      return this.mapBudget(newBudget);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          `Budget for category ${budgetData.categoryId}, type ${budgetData.type}, month ${budgetData.month}, and year ${budgetData.year} already exists`,
        );
      }
      throw error;
    }
  }

  async updateBudget(id: string, budgetData: UpdateBudgetDto) {
    if (
      budgetData.month !== undefined ||
      budgetData.year !== undefined ||
      budgetData.type !== undefined
    ) {
      this.validateBudgetDataPartial(budgetData);
    }

    if (budgetData.categoryId !== undefined) {
      let category = null;

      try {
        category = await this.categoriesService.getCategoryById(
          budgetData.categoryId,
        );
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${budgetData.categoryId} does not exist`,
        );
      }
    }

    const existingBudget = await this.prisma.budget.findUnique({
      where: { id },
      select: this.budgetSelect,
    });

    if (!existingBudget) {
      return null;
    }

    try {
      const updatedBudget = await this.prisma.budget.update({
        where: { id },
        data: {
          amount: budgetData.amount,
          categoryId: budgetData.categoryId,
          month: budgetData.month,
          year: budgetData.year,
          type:
            budgetData.type !== undefined
              ? this.normalizeBudgetType(budgetData.type)
              : undefined,
        },
        select: this.budgetSelect,
      });
      return this.mapBudget(updatedBudget);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const payload = {
          categoryId: budgetData.categoryId ?? existingBudget.categoryId,
          type: budgetData.type ?? existingBudget.type,
          month: budgetData.month ?? existingBudget.month,
          year: budgetData.year ?? existingBudget.year,
        };
        throw new BadRequestException(
          `Budget for category ${payload.categoryId}, type ${payload.type}, month ${payload.month}, and year ${payload.year} already exists`,
        );
      }
      throw error;
    }
  }

  async deleteBudget(id: string) {
    const existingBudget = await this.prisma.budget.findUnique({
      where: { id },
      select: this.budgetSelect,
    });

    if (!existingBudget) {
      return null;
    }

    const deletedBudget = await this.prisma.budget.delete({
      where: { id },
      select: this.budgetSelect,
    });

    return this.mapBudget(deletedBudget);
  }

  private validateBudgetData(budgetData: CreateBudgetDto): void {
    if (budgetData.month < 1 || budgetData.month > 12) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
  }

  private validateBudgetDataPartial(budgetData: UpdateBudgetDto): void {
    if (
      budgetData.month !== undefined &&
      (budgetData.month < 1 || budgetData.month > 12)
    ) {
      throw new BadRequestException('Month must be between 1 and 12');
    }
  }

  async getSpentAmount(budgetId: string): Promise<number> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return 0;
    }

    return this.calculateSpentAmount(budget);
  }

  async getRemainingBudget(budgetId: string): Promise<number> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return 0;
    }

    const spent = await this.calculateSpentAmount(budget);
    return budget.amount - spent;
  }

  async getBudgetWithSpending(
    budgetId: string,
  ): Promise<BudgetWithSpending | null> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return null;
    }

    const spent = await this.calculateSpentAmount(budget);
    const remaining = budget.amount - spent;
    const utilizationPercentage =
      budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      spent,
      remaining,
      utilizationPercentage,
    };
  }

  async getTransactionsForBudget(budgetId: string) {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return [];
    }

    const { start, end } = this.getMonthRange(budget.month, budget.year);
    const transactionType = this.getTransactionTypeForBudget(budget.type);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        categoryId: budget.categoryId,
        type: transactionType,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: this.transactionSelect,
    });

    return transactions.map((transaction) => this.mapTransaction(transaction));
  }

  async getBudgetWithCategory(budgetId: string): Promise<any> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return null;
    }

    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        budget.categoryId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    return {
      ...budget,
      category: category || null,
    };
  }

  async getBudgetsWithTransactions(budgetId: string): Promise<any> {
    const budget = await this.getBudgetById(budgetId);
    if (!budget) {
      return null;
    }

    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        budget.categoryId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    const [transactions, spent] = await Promise.all([
      this.getTransactionsForBudget(budgetId),
      this.calculateSpentAmount(budget),
    ]);
    const remaining = budget.amount - spent;
    const utilizationPercentage =
      budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      category: category || null,
      transactions,
      spent,
      remaining,
      utilizationPercentage,
    };
  }

  async getBudgetsByCategory(
    categoryId: string,
  ): Promise<BudgetWithSpending[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { categoryId },
      select: this.budgetSelect,
    });

    const results = await Promise.all(
      budgets.map(async (budget) => {
        const mapped = this.mapBudget(budget);
        const spent = await this.calculateSpentAmount(mapped);
        const remaining = mapped.amount - spent;
        const utilizationPercentage =
          mapped.amount > 0 ? (spent / mapped.amount) * 100 : 0;

        return {
          ...mapped,
          spent,
          remaining,
          utilizationPercentage,
        };
      }),
    );

    return results;
  }
}
