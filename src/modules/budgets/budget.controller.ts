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

// TODO: Replace with actual userId from authentication context
const DEMO_USER_ID = 'd1a2b3c4-0000-0000-0000-000000000000';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  async getAllBudgets() {
    return this.budgetService.getAllBudgets(DEMO_USER_ID);
  }

  @Get(':id')
  async getBudgetById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.budgetService.getBudgetById(id, DEMO_USER_ID);
  }

  @Get(':id/details')
  async getBudgetsWithTransactions(
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.budgetService.getBudgetsWithTransactions(id, DEMO_USER_ID);
  }

  @Get('category/:categoryId')
  getBudgetsByCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
  ): ReturnType<BudgetService['getBudgetsByCategory']> {
    return this.budgetService.getBudgetsByCategory(categoryId, DEMO_USER_ID);
  }

  @Post()
  async createBudget(@Body() budgetData: CreateBudgetDto) {
    return this.budgetService.createBudget(budgetData, DEMO_USER_ID);
  }

  @Put(':id')
  async updateBudget(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    budgetData: UpdateBudgetDto,
  ) {
    return this.budgetService.updateBudget(id, budgetData, DEMO_USER_ID);
  }

  @Delete(':id')
  async deleteBudget(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.budgetService.deleteBudget(id, DEMO_USER_ID);
  }
}
