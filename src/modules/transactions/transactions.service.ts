import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  private transactions: {
    id: number;
    amount: number;
    type: string;
    categoryId: number;
    date: string;
  }[] = [];

  getAllTransactions() {
    return this.transactions;
  }

  getTransactionById(id: number) {
    return this.transactions.find((transaction) => transaction.id === id);
  }

  createTransaction(createTransactionDto: CreateTransactionDto) {
    const newTransaction = {
      id: this.transactions.length + 1,
      ...createTransactionDto,
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  updateTransaction(id: number, updateTransactionDto: UpdateTransactionDto) {
    const transactionIndex = this.transactions.findIndex(
      (transaction) => transaction.id === id,
    );
    if (transactionIndex > -1) {
      this.transactions[transactionIndex] = { id, ...updateTransactionDto };
      return this.transactions[transactionIndex];
    }
    return null;
  }

  deleteTransaction(id: number) {
    const transactionIndex = this.transactions.findIndex(
      (transaction) => transaction.id === id,
    );
    if (transactionIndex > -1) {
      const deletedTransaction = this.transactions.splice(transactionIndex, 1);
      return deletedTransaction[0];
    }
    return null;
  }
}
