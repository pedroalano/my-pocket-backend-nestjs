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
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  getAllBudgets() {
    return this.budgetService.getAllBudgets();
  }

  @Get(':id')
  getBudgetById(@Param('id') id: string) {
    return this.budgetService.getBudgetById(+id);
  }

  @Get(':id/details')
  getBudgetsWithTransactions(@Param('id') id: string) {
    return this.budgetService.getBudgetsWithTransactions(+id);
  }

  @Get('category/:categoryId')
  getBudgetsByCategory(@Param('categoryId') categoryId: string) {
    return this.budgetService.getBudgetsByCategory(+categoryId);
  }

  @Post()
  createBudget(@Body() budgetData: CreateBudgetDto) {
    return this.budgetService.createBudget(budgetData);
  }

  @Put(':id')
  updateBudget(
    @Param('id') id: number,
    @Body()
    budgetData: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(id, budgetData);
  }

  @Delete(':id')
  deleteBudget(@Param('id') id: number) {
    return this.budgetService.deleteBudget(id);
  }
}
