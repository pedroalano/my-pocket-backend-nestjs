import { api } from '@/lib/api';
import {
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
} from '@/types';

export const transactionsApi = {
  getAll: () => api.get<Transaction[]>('/transactions'),

  getById: (id: string) => api.get<Transaction>(`/transactions/${id}`),

  create: (data: CreateTransactionDto) =>
    api.post<Transaction>('/transactions', data),

  update: (id: string, data: UpdateTransactionDto) =>
    api.put<Transaction>(`/transactions/${id}`, data),

  delete: (id: string) => api.delete<void>(`/transactions/${id}`),
};
