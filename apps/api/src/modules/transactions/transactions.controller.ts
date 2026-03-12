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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import {
  ApiGetAllTransactions,
  ApiGetTransactionById,
  ApiCreateTransaction,
  ApiUpdateTransaction,
  ApiDeleteTransaction,
} from './transactions.swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiGetAllTransactions()
  async getAllTransactions(@Request() req: AuthenticatedRequest) {
    return this.transactionsService.getAllTransactions(req.user.userId);
  }

  @Get(':id')
  @ApiGetTransactionById()
  async getTransactionById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionsService.getTransactionById(id, req.user.userId);
  }

  @Post()
  @ApiCreateTransaction()
  async createTransaction(
    @Body() createTransactionDto: CreateTransactionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionsService.createTransaction(
      createTransactionDto,
      req.user.userId,
    );
  }

  @Put(':id')
  @ApiUpdateTransaction()
  async updateTransaction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionsService.updateTransaction(
      id,
      updateTransactionDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiDeleteTransaction()
  async deleteTransaction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.transactionsService.deleteTransaction(id, req.user.userId);
  }
}
