import { Injectable } from '@nestjs/common';
import { CategoryType, TransactionType } from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';
import { BudgetVsActualDto } from './dto/budget-vs-actual.dto';
import { MonthlySummaryDto } from './dto/monthly-summary.dto';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private getMonthRange(month: number, year: number) {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    return { start, end };
  }

  async getMonthlySummary(
    userId: string,
    month: number,
    year: number,
  ): Promise<MonthlySummaryDto> {
    const { start, end } = this.getMonthRange(month, year);

    // Fetch all transactions for the month
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        amount: true,
        type: true,
      },
    });

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      if (transaction.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        totalExpense += amount;
      }
    });

    const balance = totalIncome - totalExpense;

    return {
      totalIncome,
      totalExpense,
      balance,
    };
  }

  async getBudgetVsActual(
    userId: string,
    month: number,
    year: number,
  ): Promise<BudgetVsActualDto[]> {
    const { start, end } = this.getMonthRange(month, year);

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        month,
        year,
      },
      select: {
        amount: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        amount: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    const actualByCategory = new Map<
      string,
      {
        category: { id: string; name: string; type: CategoryType };
        actualAmount: number;
      }
    >();

    transactions.forEach((transaction) => {
      const amount = Number(transaction.amount);
      const existing = actualByCategory.get(transaction.categoryId);

      if (existing) {
        existing.actualAmount += amount;
        return;
      }

      actualByCategory.set(transaction.categoryId, {
        category: transaction.category,
        actualAmount: amount,
      });
    });

    const results: BudgetVsActualDto[] = [];
    const budgetCategoryIds = new Set<string>();

    budgets.forEach((budget) => {
      const budgetAmount = Number(budget.amount);
      const actualEntry = actualByCategory.get(budget.categoryId);
      const actualAmount = actualEntry?.actualAmount ?? 0;
      const difference = budgetAmount - actualAmount;
      const percentageUsed =
        budgetAmount === 0
          ? actualAmount > 0
            ? 100
            : 0
          : (actualAmount / budgetAmount) * 100;

      results.push({
        category: budget.category,
        budgetAmount,
        actualAmount,
        difference,
        percentageUsed,
      });

      budgetCategoryIds.add(budget.categoryId);
    });

    actualByCategory.forEach((entry, categoryId) => {
      if (budgetCategoryIds.has(categoryId)) {
        return;
      }

      const budgetAmount = 0;
      const actualAmount = entry.actualAmount;
      const difference = budgetAmount - actualAmount;
      const percentageUsed = actualAmount > 0 ? 100 : 0;

      results.push({
        category: entry.category,
        budgetAmount,
        actualAmount,
        difference,
        percentageUsed,
      });
    });

    return results;
  }
}
