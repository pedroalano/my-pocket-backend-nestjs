import { api } from '@/lib/api';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '@/types';

export interface BatchCategoryItem {
  name: string;
  type: string;
}

export interface BatchResult {
  created: number;
  skipped: number;
}

export const categoriesApi = {
  getAll: () => api.get<Category[]>('/categories'),

  getById: (id: string) => api.get<Category>(`/categories/${id}`),

  create: (data: CreateCategoryDto) => api.post<Category>('/categories', data),

  batchCreate: (items: BatchCategoryItem[]) =>
    api.post<BatchResult>('/categories/batch', { categories: items }),

  update: (id: string, data: UpdateCategoryDto) =>
    api.put<Category>(`/categories/${id}`, data),

  delete: (id: string) => api.delete<void>(`/categories/${id}`),
};
