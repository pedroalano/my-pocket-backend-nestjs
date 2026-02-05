import { Injectable, BadRequestException } from '@nestjs/common';

type Budget = { id: number; amount: number; categoryId: number; month: string };

@Injectable()
export class BudgetService {
  private budgets: Budget[] = [];

  getAllBudgets() {
    return this.budgets;
  }

  getBudgetById(id: number) {
    return this.budgets.find((budget) => budget.id === id);
  }

  createBudget(budget: Omit<Budget, 'id'>) {
    const newBudget = { id: this.budgets.length + 1, ...budget };
    this.budgets.push(newBudget);
    return newBudget;
  }

  updateBudget(id: number, updatedBudget: Partial<Omit<Budget, 'id'>>) {
    const budgetIndex = this.budgets.findIndex((budget) => budget.id === id);
    if (budgetIndex === -1) {
      throw new BadRequestException(`Budget with ID ${id} does not exist`);
    }
    this.budgets[budgetIndex] = {
      ...this.budgets[budgetIndex],
      ...updatedBudget,
    };
    return this.budgets[budgetIndex];
  }

  deleteBudget(id: number) {
    const budgetIndex = this.budgets.findIndex((budget) => budget.id === id);
    if (budgetIndex === -1) {
      throw new BadRequestException(`Budget with ID ${id} does not exist`);
    }
    this.budgets.splice(budgetIndex, 1);
    return { message: `Budget with ID ${id} has been deleted` };
  }
}
