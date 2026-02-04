import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';

@Controller('budgets')
export class BudgetController {
  constructor() {}

  @Get()
  getAllBudgets() {
    return [];
  }

  @Get(':id')
  getBudgetById(@Param('id') id: number) {
    return { id };
  }

  @Post()
  createBudget(@Body() createBudgetDto: [{ name: string; amount: number }]) {
    return createBudgetDto;
  }

  @Put(':id')
  updateBudget(
    @Param('id') id: number,
    @Body() updateBudgetDto: [{ name: string; amount: number }],
  ) {
    return updateBudgetDto;
  }

  @Delete(':id')
  deleteBudget(@Param('id') id: number) {
    return { id };
  }
}
