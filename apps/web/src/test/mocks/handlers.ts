import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:3001';

// Mock data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockCategories = [
  {
    id: 'cat-1',
    name: 'Salary',
    type: 'INCOME',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Groceries',
    type: 'EXPENSE',
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

export const mockBudgets = [
  {
    id: 'budget-1',
    amount: '500.00',
    categoryId: 'cat-2',
    month: 3,
    year: 2026,
    type: 'EXPENSE',
    userId: 'test-user-id',
  },
  {
    id: 'budget-2',
    amount: '3000.00',
    categoryId: 'cat-1',
    month: 3,
    year: 2026,
    type: 'INCOME',
    userId: 'test-user-id',
  },
];

export const mockTransactions = [
  {
    id: 'transaction-1',
    amount: '150.00',
    type: 'EXPENSE',
    categoryId: 'cat-2',
    date: '2026-03-01T10:00:00.000Z',
    description: 'Grocery shopping',
    userId: 'test-user-id',
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'transaction-2',
    amount: '3000.00',
    type: 'INCOME',
    categoryId: 'cat-1',
    date: '2026-03-05T09:00:00.000Z',
    description: 'Monthly salary',
    userId: 'test-user-id',
    createdAt: '2026-03-05T09:00:00.000Z',
    updatedAt: '2026-03-05T09:00:00.000Z',
  },
];

// Generate a valid-looking JWT for testing
export const mockToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWF0IjoxNzA0MDY3MjAwfQ.fake-signature';

export const handlers = [
  // Auth endpoints
  http.post(`${API_URL}/auths/login`, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({ access_token: mockToken });
    }
    return HttpResponse.json(
      { message: 'Invalid credentials', statusCode: 401 },
      { status: 401 },
    );
  }),

  http.post(`${API_URL}/auths/register`, async ({ request }) => {
    const body = (await request.json()) as { email: string };
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { message: 'Email already exists', statusCode: 409 },
        { status: 409 },
      );
    }
    return HttpResponse.json({ access_token: mockToken });
  }),

  // Categories endpoints
  http.get(`${API_URL}/categories`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    return HttpResponse.json(mockCategories);
  }),

  http.get(`${API_URL}/categories/:id`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const category = mockCategories.find((c) => c.id === params.id);
    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found', statusCode: 404 },
        { status: 404 },
      );
    }
    return HttpResponse.json(category);
  }),

  http.post(`${API_URL}/categories`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const body = (await request.json()) as { name: string; type: string };
    return HttpResponse.json({
      id: 'new-cat-id',
      name: body.name,
      type: body.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_URL}/categories/:id`, async ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const category = mockCategories.find((c) => c.id === params.id);
    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found', statusCode: 404 },
        { status: 404 },
      );
    }
    const body = (await request.json()) as { name?: string; type?: string };
    return HttpResponse.json({
      ...category,
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_URL}/categories/:id`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const category = mockCategories.find((c) => c.id === params.id);
    if (!category) {
      return HttpResponse.json(
        { message: 'Category not found', statusCode: 404 },
        { status: 404 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Budgets endpoints
  http.get(`${API_URL}/budgets`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    return HttpResponse.json(mockBudgets);
  }),

  http.get(`${API_URL}/budgets/:id`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const budget = mockBudgets.find((b) => b.id === params.id);
    if (!budget) {
      return HttpResponse.json(
        { message: 'Budget not found', statusCode: 404 },
        { status: 404 },
      );
    }
    return HttpResponse.json(budget);
  }),

  http.post(`${API_URL}/budgets`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const body = (await request.json()) as {
      amount: number;
      categoryId: string;
      month: number;
      year: number;
      type: string;
    };
    return HttpResponse.json({
      id: 'new-budget-id',
      amount: body.amount.toFixed(2),
      categoryId: body.categoryId,
      month: body.month,
      year: body.year,
      type: body.type,
      userId: 'test-user-id',
    });
  }),

  http.put(`${API_URL}/budgets/:id`, async ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const budget = mockBudgets.find((b) => b.id === params.id);
    if (!budget) {
      return HttpResponse.json(
        { message: 'Budget not found', statusCode: 404 },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      amount?: number;
      categoryId?: string;
      month?: number;
      year?: number;
      type?: string;
    };
    return HttpResponse.json({
      ...budget,
      amount:
        body.amount !== undefined ? body.amount.toFixed(2) : budget.amount,
      categoryId: body.categoryId ?? budget.categoryId,
      month: body.month ?? budget.month,
      year: body.year ?? budget.year,
      type: body.type ?? budget.type,
    });
  }),

  http.delete(`${API_URL}/budgets/:id`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const budget = mockBudgets.find((b) => b.id === params.id);
    if (!budget) {
      return HttpResponse.json(
        { message: 'Budget not found', statusCode: 404 },
        { status: 404 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),

  // Transactions endpoints
  http.get(`${API_URL}/transactions`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    return HttpResponse.json(mockTransactions);
  }),

  http.get(`${API_URL}/transactions/:id`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const transaction = mockTransactions.find((t) => t.id === params.id);
    if (!transaction) {
      return HttpResponse.json(
        { message: 'Transaction not found', statusCode: 404 },
        { status: 404 },
      );
    }
    return HttpResponse.json(transaction);
  }),

  http.post(`${API_URL}/transactions`, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const body = (await request.json()) as {
      amount: number;
      type: string;
      categoryId: string;
      date: string;
      description?: string;
    };
    return HttpResponse.json({
      id: 'new-transaction-id',
      amount: body.amount.toFixed(2),
      type: body.type,
      categoryId: body.categoryId,
      date: body.date,
      description: body.description,
      userId: 'test-user-id',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  http.put(`${API_URL}/transactions/:id`, async ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const transaction = mockTransactions.find((t) => t.id === params.id);
    if (!transaction) {
      return HttpResponse.json(
        { message: 'Transaction not found', statusCode: 404 },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      amount?: number;
      type?: string;
      categoryId?: string;
      date?: string;
      description?: string;
    };
    return HttpResponse.json({
      ...transaction,
      amount:
        body.amount !== undefined ? body.amount.toFixed(2) : transaction.amount,
      type: body.type ?? transaction.type,
      categoryId: body.categoryId ?? transaction.categoryId,
      date: body.date ?? transaction.date,
      description: body.description ?? transaction.description,
      updatedAt: new Date().toISOString(),
    });
  }),

  http.delete(`${API_URL}/transactions/:id`, ({ params, request }) => {
    const auth = request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return HttpResponse.json(
        { message: 'Unauthorized', statusCode: 401 },
        { status: 401 },
      );
    }
    const transaction = mockTransactions.find((t) => t.id === params.id);
    if (!transaction) {
      return HttpResponse.json(
        { message: 'Transaction not found', statusCode: 404 },
        { status: 404 },
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
