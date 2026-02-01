import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';

type TransactionDto = {
  amount: number;
  type: string;
  categoryId: number;
  date: string;
};

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  getAllTransactions() {
    return this.transactionsService.getAllTransactions();
  }

  @Get(':id')
  getTransactionById(@Param('id') id: number) {
    return this.transactionsService.getTransactionById(id);
  }

  @Post()
  createTransaction(@Body() createTransactionDto: TransactionDto) {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Put(':id')
  updateTransaction(
    @Param('id') id: number,
    @Body() updateTransactionDto: TransactionDto,
  ) {
    return this.transactionsService.updateTransaction(id, updateTransactionDto);
  }

  @Delete(':id')
  deleteTransaction(@Param('id') id: number) {
    return this.transactionsService.deleteTransaction(id);
  }
}
