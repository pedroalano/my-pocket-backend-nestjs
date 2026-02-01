import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';

type TransactionDto = {
  value: number;
  date: string;
  categoryId: number;
  createdAt?: Date;
  updatedAt?: Date;
};

@Controller('transactions')
export class TransactionController {
  constructor() {}

  @Get()
  getAllTransactions() {
    return [];
  }

  @Get(':id')
  getTransactionById(@Param('id') id: number) {
    return [
      {
        id: id,
        value: 500.0,
        date: '2026-01-31',
        categoryId: 1,
        createdAt: '2026-01-31',
        updatedAt: '2026-01-31',
      },
    ];
  }

  @Post()
  createTransaction(@Body() createTransactionDto: TransactionDto) {
    return createTransactionDto;
  }

  @Put(':id')
  updateTransaction(
    @Param('id') id: number,
    @Body() updateTransactionDto: TransactionDto,
  ) {
    return updateTransactionDto;
  }

  @Delete(':id')
  deleteTransaction(@Param('id') id: number) {
    return [{ message: `Transaction with id ${id} deleted successfully.` }];
  }
}
