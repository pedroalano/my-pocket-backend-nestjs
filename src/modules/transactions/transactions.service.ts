import { Injectable } from '@nestjs/common';

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

  createTransaction(createTransactionDto: {
    amount: number;
    type: string;
    categoryId: number;
    date: string;
  }) {
    const newTransaction = {
      id: this.transactions.length + 1,
      ...createTransactionDto,
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  updateTransaction(
    id: number,
    updateTransactionDto: {
      amount: number;
      type: string;
      categoryId: number;
      date: string;
    },
  ) {
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
