import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BudgetType, Prisma, TransactionType } from '@prisma/client';
import { I18nService, I18nContext } from 'nestjs-i18n';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../shared/prisma.service';
import { formatDecimal } from '../shared';

type BudgetWithSpendingExpense = {
  id: string;
  amount: string;
  categoryId: string;
  month: number;
  year: number;
  type: typeof BudgetType.EXPENSE;
  spent: string;
  remaining: string;
  utilizationPercentage: number;
};

type BudgetWithSpendingIncome = {
  id: string;
  amount: string;
  categoryId: string;
  month: number;
  year: number;
  type: typeof BudgetType.INCOME;
  earned: string;
  remaining: string;
  utilizationPercentage: number;
};

type BudgetWithSpending = BudgetWithSpendingExpense | BudgetWithSpendingIncome;

type BudgetBase = {
  id: string;
  amount: string;
  categoryId: string;
  month: number;
  year: number;
  type: BudgetType;
};

type CategoryInfo = {
  id: string;
  name: string;
  type: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
} | null;

type TransactionInfo = {
  id: string;
  amount: string;
  categoryId: string;
  type: TransactionType;
  date: string;
  description: string | null;
};

type BudgetWithCategory = BudgetBase & {
  category: CategoryInfo;
};

type BudgetWithTransactionsExpense = BudgetBase & {
  type: typeof BudgetType.EXPENSE;
  category: CategoryInfo;
  transactions: TransactionInfo[];
  spent: string;
  remaining: string;
  utilizationPercentage: number;
};

type BudgetWithTransactionsIncome = BudgetBase & {
  type: typeof BudgetType.INCOME;
  category: CategoryInfo;
  transactions: TransactionInfo[];
  earned: string;
  remaining: string;
  utilizationPercentage: number;
};

type BudgetWithTransactions =
  | BudgetWithTransactionsExpense
  | BudgetWithTransactionsIncome;

@Injectable()
export class BudgetService {
  constructor(
    private categoriesService: CategoriesService,
    private prisma: PrismaService,
    private i18n: I18nService,
  ) {}

  private get lang(): string {
    return I18nContext.current()?.lang ?? 'en';
  }

  private readonly budgetSelect = {
    id: true,
    amount: true,
    categoryId: true,
    month: true,
    year: true,
    type: true,
    userId: true,
  };

  private readonly transactionSelect = {
    id: true,
    amount: true,
    categoryId: true,
    type: true,
    date: true,
    description: true,
  };

  private mapBudget(budget: {
    id: string;
    amount: { toString(): string };
    categoryId: string;
    month: number;
    year: number;
    type: BudgetType;
  }) {
    return {
      ...budget,
      amount: formatDecimal(budget.amount),
    };
  }

  private mapTransaction(transaction: {
    id: string;
    amount: { toString(): string };
    categoryId: string;
    type: TransactionType;
    date: Date;
    description: string | null;
  }) {
    return {
      ...transaction,
      amount: formatDecimal(transaction.amount),
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

  private async calculateSpentAmount(
    budget: {
      categoryId: string;
      month: number;
      year: number;
      type: BudgetType;
    },
    userId: string,
  ) {
    const { start, end } = this.getMonthRange(budget.month, budget.year);
    const transactionType = this.getTransactionTypeForBudget(budget.type);
    const spent = await this.prisma.transaction.aggregate({
      where: {
        userId,
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

  async getAllBudgets(userId: string) {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      select: this.budgetSelect,
    });
    return budgets.map((budget) => {
      const { userId: _userId, ...budgetWithoutUserId } = budget;
      return this.mapBudget(budgetWithoutUserId);
    });
  }

  async getBudgetById(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      select: this.budgetSelect,
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t('budgets.errors.notFound', {
          args: { id },
          lang: this.lang,
        }),
      );
    }

    const { userId: _userId, ...budgetWithoutUserId } = budget;
    return this.mapBudget(budgetWithoutUserId);
  }

  async createBudget(budgetData: CreateBudgetDto, userId: string) {
    this.validateBudgetData(budgetData);

    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        budgetData.categoryId,
        userId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }
    if (!category) {
      throw new BadRequestException(
        this.i18n.t('budgets.errors.categoryNotFound', {
          args: { id: budgetData.categoryId },
          lang: this.lang,
        }),
      );
    }

    try {
      const newBudget = await this.prisma.budget.create({
        data: {
          amount: budgetData.amount,
          categoryId: budgetData.categoryId,
          month: budgetData.month,
          year: budgetData.year,
          type: category.type as unknown as BudgetType,
          userId,
        },
        select: this.budgetSelect,
      });
      const { userId: _userId, ...budgetWithoutUserId } = newBudget;
      return this.mapBudget(budgetWithoutUserId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          this.i18n.t('budgets.errors.alreadyExists', {
            args: {
              categoryName: category.name,
              type: category.type,
              month: budgetData.month,
              year: budgetData.year,
            },
            lang: this.lang,
          }),
        );
      }
      throw error;
    }
  }

  async updateBudget(id: string, budgetData: UpdateBudgetDto, userId: string) {
    const existingBudget = await this.prisma.budget.findUnique({
      where: { id },
      select: this.budgetSelect,
    });

    if (!existingBudget || existingBudget.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t('budgets.errors.notFound', {
          args: { id },
          lang: this.lang,
        }),
      );
    }

    if (budgetData.month !== undefined || budgetData.year !== undefined) {
      this.validateBudgetDataPartial(budgetData);
    }

    let newType: BudgetType | undefined;
    let categoryName: string | undefined;

    if (budgetData.categoryId !== undefined) {
      let category = null;

      try {
        category = await this.categoriesService.getCategoryById(
          budgetData.categoryId,
          userId,
        );
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
      if (!category) {
        throw new BadRequestException(
          this.i18n.t('budgets.errors.categoryNotFound', {
            args: { id: budgetData.categoryId },
            lang: this.lang,
          }),
        );
      }
      newType = category.type as unknown as BudgetType;
      categoryName = category.name;
    }

    try {
      const updatedBudget = await this.prisma.budget.update({
        where: { id },
        data: {
          amount: budgetData.amount,
          categoryId: budgetData.categoryId,
          month: budgetData.month,
          year: budgetData.year,
          type: newType,
        },
        select: this.budgetSelect,
      });
      const { userId: _userId, ...budgetWithoutUserId } = updatedBudget;
      return this.mapBudget(budgetWithoutUserId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const resolvedCategoryId =
          budgetData.categoryId ?? existingBudget.categoryId;
        if (!categoryName) {
          try {
            const cat = await this.categoriesService.getCategoryById(
              resolvedCategoryId,
              userId,
            );
            categoryName = cat?.name;
          } catch {
            categoryName = resolvedCategoryId;
          }
        }
        const payload = {
          categoryName: categoryName ?? resolvedCategoryId,
          type: newType ?? existingBudget.type,
          month: budgetData.month ?? existingBudget.month,
          year: budgetData.year ?? existingBudget.year,
        };
        throw new ConflictException(
          this.i18n.t('budgets.errors.alreadyExists', {
            args: {
              categoryName: payload.categoryName,
              type: payload.type,
              month: payload.month,
              year: payload.year,
            },
            lang: this.lang,
          }),
        );
      }
      throw error;
    }
  }

  async deleteBudget(id: string, userId: string) {
    const existingBudget = await this.prisma.budget.findUnique({
      where: { id },
      select: this.budgetSelect,
    });

    if (!existingBudget || existingBudget.userId !== userId) {
      throw new NotFoundException(
        this.i18n.t('budgets.errors.notFound', {
          args: { id },
          lang: this.lang,
        }),
      );
    }

    const deletedBudget = await this.prisma.budget.delete({
      where: { id },
      select: this.budgetSelect,
    });

    const { userId: _userId, ...budgetWithoutUserId } = deletedBudget;
    return this.mapBudget(budgetWithoutUserId);
  }

  private validateBudgetData(budgetData: CreateBudgetDto): void {
    if (budgetData.month < 1 || budgetData.month > 12) {
      throw new BadRequestException(
        this.i18n.t('budgets.errors.invalidMonth', { lang: this.lang }),
      );
    }
  }

  private validateBudgetDataPartial(budgetData: UpdateBudgetDto): void {
    if (
      budgetData.month !== undefined &&
      (budgetData.month < 1 || budgetData.month > 12)
    ) {
      throw new BadRequestException(
        this.i18n.t('budgets.errors.invalidMonth', { lang: this.lang }),
      );
    }
  }

  async getSpentAmount(budgetId: string, userId: string): Promise<number> {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return 0;
    }

    return this.calculateSpentAmount(budget, userId);
  }

  async getRemainingBudget(budgetId: string, userId: string): Promise<string> {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return formatDecimal(0);
    }

    const spent = await this.calculateSpentAmount(budget, userId);
    return formatDecimal(Number(budget.amount) - spent);
  }

  async getBudgetWithSpending(
    budgetId: string,
    userId: string,
  ): Promise<BudgetWithSpending | null> {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return null;
    }

    const progressAmount = await this.calculateSpentAmount(budget, userId);
    const numericAmount = Number(budget.amount);
    const remaining = numericAmount - progressAmount;
    const utilizationPercentage =
      numericAmount > 0 ? (progressAmount / numericAmount) * 100 : 0;

    if (budget.type === BudgetType.INCOME) {
      return {
        ...budget,
        type: BudgetType.INCOME,
        earned: formatDecimal(progressAmount),
        remaining: formatDecimal(remaining),
        utilizationPercentage,
      };
    }

    return {
      ...budget,
      type: BudgetType.EXPENSE,
      spent: formatDecimal(progressAmount),
      remaining: formatDecimal(remaining),
      utilizationPercentage,
    };
  }

  async getTransactionsForBudget(budgetId: string, userId: string) {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return [];
    }

    const { start, end } = this.getMonthRange(budget.month, budget.year);
    const transactionType = this.getTransactionTypeForBudget(budget.type);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
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

  async getBudgetWithCategory(
    budgetId: string,
    userId: string,
  ): Promise<BudgetWithCategory | null> {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return null;
    }

    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        budget.categoryId,
        userId,
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

  async getBudgetsWithTransactions(
    budgetId: string,
    userId: string,
  ): Promise<BudgetWithTransactions | null> {
    const budget = await this.getBudgetById(budgetId, userId);
    if (!budget) {
      return null;
    }

    let category = null;

    try {
      category = await this.categoriesService.getCategoryById(
        budget.categoryId,
        userId,
      );
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    const [transactions, progressAmount] = await Promise.all([
      this.getTransactionsForBudget(budgetId, userId),
      this.calculateSpentAmount(budget, userId),
    ]);
    const numericAmount = Number(budget.amount);
    const remaining = numericAmount - progressAmount;
    const utilizationPercentage =
      numericAmount > 0 ? (progressAmount / numericAmount) * 100 : 0;

    if (budget.type === BudgetType.INCOME) {
      return {
        ...budget,
        type: BudgetType.INCOME,
        category: category || null,
        transactions,
        earned: formatDecimal(progressAmount),
        remaining: formatDecimal(remaining),
        utilizationPercentage,
      };
    }

    return {
      ...budget,
      type: BudgetType.EXPENSE,
      category: category || null,
      transactions,
      spent: formatDecimal(progressAmount),
      remaining: formatDecimal(remaining),
      utilizationPercentage,
    };
  }

  async getBudgetsByCategory(
    categoryId: string,
    userId: string,
  ): Promise<BudgetWithSpending[]> {
    const budgets = await this.prisma.budget.findMany({
      where: { categoryId, userId },
      select: this.budgetSelect,
    });

    const results = await Promise.all(
      budgets.map(async (budget) => {
        const mapped = this.mapBudget(budget);
        const progressAmount = await this.calculateSpentAmount(mapped, userId);
        const numericAmount = Number(mapped.amount);
        const remaining = numericAmount - progressAmount;
        const utilizationPercentage =
          numericAmount > 0 ? (progressAmount / numericAmount) * 100 : 0;

        if (budget.type === BudgetType.INCOME) {
          return {
            ...mapped,
            type: BudgetType.INCOME,
            earned: formatDecimal(progressAmount),
            remaining: formatDecimal(remaining),
            utilizationPercentage,
          };
        }

        return {
          ...mapped,
          type: BudgetType.EXPENSE,
          spent: formatDecimal(progressAmount),
          remaining: formatDecimal(remaining),
          utilizationPercentage,
        };
      }),
    );

    return results;
  }
}
