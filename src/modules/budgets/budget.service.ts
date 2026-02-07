import { Injectable } from '@nestjs/common';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { CategoriesService } from '../categories/categories.service';
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

  constructor(private categoriesService: CategoriesService) {}

  getAllBudgets() {
    return this.budgets;
  }

  getBudgetById(id: number) {
    return this.budgets.find((budget) => budget.id === id);
  }

  createBudget(budgetData: CreateBudgetDto) {
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
}
