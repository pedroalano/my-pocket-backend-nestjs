import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { BudgetService } from './budget.service';

type Budget = { id: number; amount: number; categoryId: number; month: string };

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  getAllBudgets() {
    return this.budgetService.getAllBudgets();
  }

  @Get(':id')
  getBudgetById(@Param('id') id: number) {
    return this.budgetService.getBudgetById(id);
  }

  @Post()
  createBudget(@Body() createBudgetDto: Omit<Budget, 'id'>) {
    return this.budgetService.createBudget(createBudgetDto);
  }

  @Put(':id')
  updateBudget(
    @Param('id') id: number,
    @Body() updateBudgetDto: Partial<Omit<Budget, 'id'>>,
  ) {
    return this.budgetService.updateBudget(id, updateBudgetDto);
  }

  @Delete(':id')
  deleteBudget(@Param('id') id: number) {
    return this.budgetService.deleteBudget(id);
  }
}
