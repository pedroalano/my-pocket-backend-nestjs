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
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getAllTransactions() {
    return this.transactionsService.getAllTransactions();
  }

  @Get(':id')
  async getTransactionById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.getTransactionById(id);
  }

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(createTransactionDto);
  }

  @Put(':id')
  async updateTransaction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(id, updateTransactionDto);
  }

  @Delete(':id')
  async deleteTransaction(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.deleteTransaction(id);
  }
}
