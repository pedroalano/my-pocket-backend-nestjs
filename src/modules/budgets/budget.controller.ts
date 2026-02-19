import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  async getAllBudgets(@Request() req: AuthenticatedRequest) {
    return this.budgetService.getAllBudgets(req.user.userId);
  }

  @Get(':id')
  async getBudgetById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.budgetService.getBudgetById(id, req.user.userId);
  }

  @Get(':id/details')
  async getBudgetsWithTransactions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.budgetService.getBudgetsWithTransactions(id, req.user.userId);
  }

  @Get('category/:categoryId')
  getBudgetsByCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Request() req: AuthenticatedRequest,
  ): ReturnType<BudgetService['getBudgetsByCategory']> {
    return this.budgetService.getBudgetsByCategory(categoryId, req.user.userId);
  }

  @Post()
  async createBudget(
    @Body() budgetData: CreateBudgetDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.budgetService.createBudget(budgetData, req.user.userId);
  }

  @Put(':id')
  async updateBudget(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body()
    budgetData: UpdateBudgetDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.budgetService.updateBudget(id, budgetData, req.user.userId);
  }

  @Delete(':id')
  async deleteBudget(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.budgetService.deleteBudget(id, req.user.userId);
  }
}
