import { Injectable } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CategoriesService } from '../categories/categories.service';
import { TransactionsService } from '../transactions/transactions.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class BudgetService {
  private budgets: {
    id: number;
    amount: number;
    categoryId: number;
    month: number;
    year: number;
    type: string;
  }[] = [];

  constructor(
    private categoriesService: CategoriesService,
    private transactionsService: TransactionsService,
  ) {}

  getAllBudgets() {
    return this.budgets;
  }

  getBudgetById(id: number) {
    return this.budgets.find((budget) => budget.id === id);
  }

  createBudget(budgetData: CreateBudgetDto) {
    this.validateBudgetData(budgetData);
    this.checkDuplicateBudget(budgetData);

    const category = this.categoriesService.getCategoryById(
      budgetData.categoryId,
    );
    if (!category) {
      throw new BadRequestException(
        `Category with ID ${budgetData.categoryId} does not exist`,
      );
    }

    const newBudget = {
      id: this.budgets.length + 1,
      ...budgetData,
    };
    this.budgets.push(newBudget);
    return newBudget;
  }

  updateBudget(id: number, budgetData: UpdateBudgetDto) {
    if (
      budgetData.month !== undefined ||
      budgetData.year !== undefined ||
      budgetData.type !== undefined
    ) {
      this.validateBudgetDataPartial(budgetData);
    }

    if (budgetData.categoryId !== undefined) {
      const category = this.categoriesService.getCategoryById(
        budgetData.categoryId,
      );
      if (!category) {
        throw new BadRequestException(
          `Category with ID ${budgetData.categoryId} does not exist`,
        );
      }
    }
    const budgetIndex = this.budgets.findIndex((budget) => budget.id === id);
    if (budgetIndex > -1) {
      this.budgets[budgetIndex] = {
        ...this.budgets[budgetIndex],
        ...budgetData,
      };
      this.checkDuplicateBudget(this.budgets[budgetIndex], id);
      return this.budgets[budgetIndex];
    }
    return null;
  }

  deleteBudget(id: number) {
    const budgetIndex = this.budgets.findIndex((budget) => budget.id === id);
    if (budgetIndex > -1) {
      const deletedBudget = this.budgets.splice(budgetIndex, 1);
      return deletedBudget[0];
    }
    return null;
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

  private checkDuplicateBudget(
    budgetData: CreateBudgetDto,
    excludeId?: number,
  ): void {
    const isDuplicate = this.budgets.some(
      (budget) =>
        budget.categoryId === budgetData.categoryId &&
        budget.type === budgetData.type &&
        budget.month === budgetData.month &&
        budget.year === budgetData.year &&
        budget.id !== excludeId,
    );

    if (isDuplicate) {
      throw new BadRequestException(
        `Budget for category ${budgetData.categoryId}, type ${budgetData.type}, month ${budgetData.month}, and year ${budgetData.year} already exists`,
      );
    }
  }

  getSpentAmount(budgetId: number): number {
    const budget = this.getBudgetById(budgetId);
    if (!budget) {
      return 0;
    }

    const transactions = this.transactionsService.getAllTransactions();
    const spent = transactions
      .filter((transaction) => {
        // Match category and type
        if (
          transaction.categoryId !== budget.categoryId ||
          transaction.type !== budget.type
        ) {
          return false;
        }

        // Extract month and year from transaction date (ISO format: YYYY-MM-DD)
        const transactionDate = new Date(transaction.date);
        const transactionMonth = transactionDate.getMonth() + 1;
        const transactionYear = transactionDate.getFullYear();

        // Check if transaction is within budget period
        return (
          transactionMonth === budget.month && transactionYear === budget.year
        );
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return spent;
  }

  getRemainingBudget(budgetId: number): number {
    const budget = this.getBudgetById(budgetId);
    if (!budget) {
      return 0;
    }

    const spent = this.getSpentAmount(budgetId);
    return budget.amount - spent;
  }

  getBudgetWithSpending(budgetId: number): any {
    const budget = this.getBudgetById(budgetId);
    if (!budget) {
      return null;
    }

    const spent = this.getSpentAmount(budgetId);
    const remaining = this.getRemainingBudget(budgetId);
    const utilizationPercentage =
      budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    return {
      ...budget,
      spent,
      remaining,
      utilizationPercentage,
    };
  }
}
