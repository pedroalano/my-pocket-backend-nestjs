import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  async getAllBudgets() {
    return this.budgetService.getAllBudgets();
  }

  @Get(':id')
  async getBudgetById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.budgetService.getBudgetById(id);
  }

  @Get(':id/details')
  async getBudgetsWithTransactions(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.budgetService.getBudgetsWithTransactions(id);
  }

  @Get('category/:categoryId')
  getBudgetsByCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ): ReturnType<BudgetService['getBudgetsByCategory']> {
    return this.budgetService.getBudgetsByCategory(categoryId);
  }

  @Post()
  async createBudget(@Body() budgetData: CreateBudgetDto) {
    return this.budgetService.createBudget(budgetData);
  }

  @Put(':id')
  async updateBudget(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    budgetData: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(id, budgetData);
  }

  @Delete(':id')
  async deleteBudget(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.budgetService.deleteBudget(id);
  }
}
