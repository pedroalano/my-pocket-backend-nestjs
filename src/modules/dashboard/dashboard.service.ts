import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { PrismaService } from '../shared/prisma.service';
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
}
