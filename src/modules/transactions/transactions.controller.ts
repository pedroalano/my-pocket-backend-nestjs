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

// TODO: Replace with actual userId from authentication context
const DEMO_USER_ID = 'd1a2b3c4-0000-0000-0000-000000000000';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async getAllTransactions() {
    return this.transactionsService.getAllTransactions(DEMO_USER_ID);
  }

  @Get(':id')
  async getTransactionById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.getTransactionById(id, DEMO_USER_ID);
  }

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(
      createTransactionDto,
      DEMO_USER_ID,
    );
  }

  @Put(':id')
  async updateTransaction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(
      id,
      updateTransactionDto,
      DEMO_USER_ID,
    );
  }

  @Delete(':id')
  async deleteTransaction(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.transactionsService.deleteTransaction(id, DEMO_USER_ID);
  }
}
