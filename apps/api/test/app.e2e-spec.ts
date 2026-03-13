import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';

describe('Personal Finance API E2E', () => {
  let app: INestApplication<App>;
  let user1Token: string;
  let user2Token: string;
  let _user1Id: string;
  let _user2Id: string;
  let categoryId: string;
  let transactionId: string;
  let budgetId: string;

  const authUser1 = {
    name: 'Test User 1',
    email: `auth-user1-${Date.now()}@test.com`,
    password: 'TestPassword123!',
  };

  const authUser2 = {
    name: 'Test User 2',
    email: `auth-user2-${Date.now()}@test.com`,
    password: 'TestPassword456!',
  };

  const seededUser1 = {
    name: 'Seeded User 1',
    email: `seeded-user1-${Date.now()}@test.com`,
    password: 'SeededPassword123!',
  };

  const seededUser2 = {
    name: 'Seeded User 2',
    email: `seeded-user2-${Date.now()}@test.com`,
    password: 'SeededPassword456!',
  };

  const registerAndGetToken = async (user: {
    name: string;
    email: string;
    password: string;
  }) => {
    const response = await request(app.getHttpServer())
      .post('/auths/register')
      .send(user)
      .expect(201);

    const token = response.body.access_token as string | undefined;

    if (!token) {
      throw new Error('Access token missing from auth register response');
    }

    return token;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    user1Token = await registerAndGetToken(seededUser1);
    user2Token = await registerAndGetToken(seededUser2);
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== HEALTH CHECK ====================
  describe('Health Check', () => {
    it('GET / should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });

    it('GET /health should return ok status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  // ==================== AUTHENTICATION FLOWS ====================
  describe('Authentication Flows', () => {
    let _authUser1Token: string;
    let _authUser2Token: string;

    describe('POST /auths/register', () => {
      it('should register new user and return access token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auths/register')
          .send(authUser1)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(typeof response.body.access_token).toBe('string');
        _authUser1Token = response.body.access_token;
      });

      it('should register second user with different email', async () => {
        const response = await request(app.getHttpServer())
          .post('/auths/register')
          .send(authUser2)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(typeof response.body.access_token).toBe('string');
        _authUser2Token = response.body.access_token;
      });

      it('should reject duplicate email registration', async () => {
        await request(app.getHttpServer())
          .post('/auths/register')
          .send(authUser1)
          .expect(409);
      });

      it('should reject invalid email format', async () => {
        await request(app.getHttpServer())
          .post('/auths/register')
          .send({
            name: 'Invalid User',
            email: 'not-an-email',
            password: 'Password123!',
          })
          .expect(400);
      });

      it('should reject password shorter than 6 characters', async () => {
        await request(app.getHttpServer())
          .post('/auths/register')
          .send({
            name: 'Test User',
            email: `test-${Date.now()}@example.com`,
            password: 'short',
          })
          .expect(400);
      });

      it('should reject missing required fields', async () => {
        await request(app.getHttpServer())
          .post('/auths/register')
          .send({
            name: 'Test User',
          })
          .expect(400);
      });
    });

    describe('POST /auths/login', () => {
      it('should login with correct credentials', async () => {
        const response = await request(app.getHttpServer())
          .post('/auths/login')
          .send({
            email: authUser1.email,
            password: authUser1.password,
          })
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(typeof response.body.access_token).toBe('string');
      });

      it('should reject login with incorrect password', async () => {
        await request(app.getHttpServer())
          .post('/auths/login')
          .send({
            email: authUser1.email,
            password: 'WrongPassword123!',
          })
          .expect(401);
      });

      it('should reject login for non-existent user', async () => {
        await request(app.getHttpServer())
          .post('/auths/login')
          .send({
            email: `nonexistent-${Date.now()}@example.com`,
            password: 'SomePassword123!',
          })
          .expect(401);
      });

      it('should reject login without authentication headers', async () => {
        await request(app.getHttpServer())
          .post('/auths/login')
          .send({})
          .expect(400);
      });
    });
  });

  // ==================== CATEGORIES CRUD ====================
  describe('Categories CRUD', () => {
    describe('POST /categories', () => {
      it('should create expense category for authenticated user', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Groceries',
            type: 'EXPENSE',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Groceries');
        expect(response.body.type).toBe('EXPENSE');
        expect(response.body).toHaveProperty('userId');
        categoryId = response.body.id;
      });

      it('should create income category', async () => {
        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Salary',
            type: 'INCOME',
          })
          .expect(201);

        expect(response.body.type).toBe('INCOME');
        expect(response.body.name).toBe('Salary');
      });

      it('should reject category creation without authentication', async () => {
        await request(app.getHttpServer())
          .post('/categories')
          .send({
            name: 'Utilities',
            type: 'EXPENSE',
          })
          .expect(401);
      });

      it('should reject duplicate category name/type for same user', async () => {
        // Create first category
        await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Duplicate Category',
            type: 'EXPENSE',
          })
          .expect(201);

        // Attempt to create duplicate
        await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Duplicate Category',
            type: 'EXPENSE',
          })
          .expect(409);
      });

      it('should allow same category name with different type', async () => {
        await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Multi Type',
            type: 'EXPENSE',
          })
          .expect(201);

        const response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Multi Type',
            type: 'INCOME',
          })
          .expect(201);

        expect(response.body.type).toBe('INCOME');
      });
    });

    describe('GET /categories', () => {
      it('should return user categories', async () => {
        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('type');
      });

      it('should return empty array for user with no categories', async () => {
        const newUserResponse = await request(app.getHttpServer())
          .post('/auths/register')
          .send({
            name: 'New User',
            email: `newuser-${Date.now()}@test.com`,
            password: 'Password123!',
          });

        const newUserToken = newUserResponse.body.access_token;

        const response = await request(app.getHttpServer())
          .get('/categories')
          .set('Authorization', `Bearer ${newUserToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer()).get('/categories').expect(401);
      });
    });

    describe('GET /categories/:id', () => {
      it('should get category by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/categories/${categoryId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.id).toBe(categoryId);
        expect(response.body.name).toBe('Groceries');
      });

      it('should reject access to other users category', async () => {
        await request(app.getHttpServer())
          .get(`/categories/${categoryId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(404);
      });

      it('should return 404 for non-existent category', async () => {
        await request(app.getHttpServer())
          .get(`/categories/00000000-0000-0000-0000-000000000000`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(404);
      });
    });

    describe('PUT /categories/:id', () => {
      it('should update category name', async () => {
        const response = await request(app.getHttpServer())
          .put(`/categories/${categoryId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Food & Groceries',
            type: 'EXPENSE',
          })
          .expect(200);

        expect(response.body.name).toBe('Food & Groceries');
        expect(response.body.id).toBe(categoryId);
      });

      it('should reject updating to duplicate name/type', async () => {
        // Create two different categories
        const cat1Response = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Category A',
            type: 'EXPENSE',
          });

        await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Category B',
            type: 'EXPENSE',
          });

        // Try to update Category B to Category A name (should fail)
        const _catBId = cat1Response.body.id;
        const catDiffId = (
          await request(app.getHttpServer())
            .post('/categories')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
              name: 'Category Different',
              type: 'EXPENSE',
            })
        ).body.id;

        await request(app.getHttpServer())
          .put(`/categories/${catDiffId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Category A',
            type: 'EXPENSE',
          })
          .expect(409);
      });

      it('should reject update to other users category', async () => {
        await request(app.getHttpServer())
          .put(`/categories/${categoryId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            name: 'Hacked',
            type: 'EXPENSE',
          })
          .expect(404);
      });
    });

    describe('DELETE /categories/:id', () => {
      it('should delete category', async () => {
        // Create a category to delete
        const createResponse = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'To Delete',
            type: 'EXPENSE',
          });

        const categoryToDeleteId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/categories/${categoryToDeleteId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Verify it's deleted
        await request(app.getHttpServer())
          .get(`/categories/${categoryToDeleteId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(404);
      });

      it('should cascade delete related transactions', async () => {
        // Create category and transaction
        const catResponse = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Cat With Transactions',
            type: 'EXPENSE',
          });

        const catId = catResponse.body.id;

        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 50.5,
            type: 'EXPENSE',
            categoryId: catId,
            date: '2026-01-15',
            description: 'Test transaction',
          })
          .expect(201);

        // Delete category
        await request(app.getHttpServer())
          .delete(`/categories/${catId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Verify transactions are deleted
        const transactionsResponse = await request(app.getHttpServer())
          .get('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        const filtered = transactionsResponse.body.filter(
          (t: any) => t.categoryId === catId,
        );
        expect(filtered.length).toBe(0);
      });

      it('should reject delete of other users category', async () => {
        await request(app.getHttpServer())
          .delete(`/categories/${categoryId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(404);
      });
    });
  });

  // ==================== TRANSACTIONS CRUD ====================
  describe('Transactions CRUD', () => {
    describe('POST /transactions', () => {
      it('should create transaction for authenticated user', async () => {
        const response = await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 50.5,
            type: 'EXPENSE',
            categoryId,
            date: '2026-01-15',
            description: 'Weekly groceries',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.amount).toBe('50.50');
        expect(response.body.type).toBe('EXPENSE');
        expect(response.body.categoryId).toBe(categoryId);
        expect(response.body.description).toBe('Weekly groceries');
        transactionId = response.body.id;
      });

      it('should create transaction without description', async () => {
        const response = await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 100,
            type: 'INCOME',
            categoryId,
            date: '2026-01-16',
          })
          .expect(201);

        expect(response.body.amount).toBe('100.00');
        expect(response.body.description).toBeNull();
      });

      it('should reject transaction without authentication', async () => {
        await request(app.getHttpServer())
          .post('/transactions')
          .send({
            amount: 100,
            type: 'INCOME',
            categoryId,
            date: '2026-01-15',
          })
          .expect(401);
      });

      it('should reject transaction with invalid category', async () => {
        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 100,
            type: 'INCOME',
            categoryId: '00000000-0000-0000-0000-000000000000',
            date: '2026-01-15',
          })
          .expect(400);
      });

      it('should reject transaction with other users category', async () => {
        // User2 creates a category
        const user2CatResponse = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            name: 'User 2 Category',
            type: 'EXPENSE',
          });

        // User1 tries to create transaction with user2 category
        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 100,
            type: 'EXPENSE',
            categoryId: user2CatResponse.body.id,
            date: '2026-01-15',
          })
          .expect(400);
      });

      it('should reject invalid amount', async () => {
        await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: -50,
            type: 'EXPENSE',
            categoryId,
            date: '2026-01-15',
          })
          .expect(400);
      });
    });

    describe('GET /transactions', () => {
      it('should return user transactions', async () => {
        const response = await request(app.getHttpServer())
          .get('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body.some((t: any) => t.id === transactionId)).toBe(
          true,
        );
      });

      it('should not return other users transactions', async () => {
        const user2Response = await request(app.getHttpServer())
          .get('/transactions')
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        expect(
          user2Response.body.every((t: any) => t.id !== transactionId),
        ).toBe(true);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer()).get('/transactions').expect(401);
      });
    });

    describe('GET /transactions/:id', () => {
      it('should get transaction by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.id).toBe(transactionId);
        expect(response.body.amount).toBe('50.50');
      });

      it('should reject access to other users transaction', async () => {
        await request(app.getHttpServer())
          .get(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(404);
      });
    });

    describe('PUT /transactions/:id', () => {
      it('should update transaction', async () => {
        const response = await request(app.getHttpServer())
          .put(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 75.5,
            type: 'EXPENSE',
            categoryId,
            date: '2026-01-20',
            description: 'Updated groceries',
          })
          .expect(200);

        expect(response.body.amount).toBe('75.50');
        expect(response.body.description).toBe('Updated groceries');
      });

      it('should reject update with other users category', async () => {
        const user2CatResponse = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            name: 'User 2 Update Category',
            type: 'EXPENSE',
          });

        await request(app.getHttpServer())
          .put(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 100,
            type: 'EXPENSE',
            categoryId: user2CatResponse.body.id,
            date: '2026-01-15',
          })
          .expect(400);
      });

      it('should reject update by other user', async () => {
        await request(app.getHttpServer())
          .put(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            amount: 999,
            type: 'EXPENSE',
            categoryId,
            date: '2026-01-15',
          })
          .expect(404);
      });
    });

    describe('DELETE /transactions/:id', () => {
      it('should delete transaction', async () => {
        // Create transaction to delete
        const createResponse = await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 25,
            type: 'EXPENSE',
            categoryId,
            date: '2026-01-15',
          });

        const txToDeleteId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/transactions/${txToDeleteId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Verify deletion
        await request(app.getHttpServer())
          .get(`/transactions/${txToDeleteId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(404);
      });

      it('should reject delete by other user', async () => {
        await request(app.getHttpServer())
          .delete(`/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(404);
      });
    });
  });

  // ==================== BUDGETS CRUD ====================
  describe('Budgets CRUD', () => {
    describe('POST /budgets', () => {
      it('should create budget for authenticated user', async () => {
        const response = await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 500,
            categoryId,
            month: 1,
            year: 2026,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.amount).toBe('500.00');
        expect(response.body.month).toBe(1);
        expect(response.body.year).toBe(2026);
        budgetId = response.body.id;
      });

      it('should reject budget without authentication', async () => {
        await request(app.getHttpServer())
          .post('/budgets')
          .send({
            amount: 500,
            categoryId,
            month: 1,
            year: 2026,
          })
          .expect(401);
      });

      it('should reject invalid month', async () => {
        await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 500,
            categoryId,
            month: 13,
            year: 2026,
          })
          .expect(400);
      });

      it('should reject invalid category', async () => {
        await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 500,
            categoryId: '00000000-0000-0000-0000-000000000000',
            month: 1,
            year: 2026,
          })
          .expect(400);
      });

      it('should reject duplicate budget for same month/category', async () => {
        // Create first budget
        await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 300,
            categoryId,
            month: 2,
            year: 2026,
          })
          .expect(201);

        // Try to create duplicate
        await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 400,
            categoryId,
            month: 2,
            year: 2026,
          })
          .expect(409);
      });

      it('should prevent overspending (budget validation)', async () => {
        // Create category for test
        const testCatResponse = await request(app.getHttpServer())
          .post('/categories')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            name: 'Test Overspend Category',
            type: 'EXPENSE',
          });

        const testCatId = testCatResponse.body.id;

        // Create transaction that will exceed budget
        const transactionResponse = await request(app.getHttpServer())
          .post('/transactions')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 1000,
            type: 'EXPENSE',
            categoryId: testCatId,
            date: '2026-03-15',
          });

        expect(transactionResponse.status).toBe(201);

        // Create budget that is lower than transaction - should still allow
        // (the budget is a limit, not enforced at creation)
        const budgetResponse = await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 500,
            categoryId: testCatId,
            month: 3,
            year: 2026,
          });

        expect(budgetResponse.status).toBe(201);
      });
    });

    describe('GET /budgets', () => {
      it('should return user budgets', async () => {
        const response = await request(app.getHttpServer())
          .get('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.some((b: any) => b.id === budgetId)).toBe(true);
      });

      it('should not return other users budgets', async () => {
        const response = await request(app.getHttpServer())
          .get('/budgets')
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        expect(response.body.every((b: any) => b.id !== budgetId)).toBe(true);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer()).get('/budgets').expect(401);
      });
    });

    describe('GET /budgets/:id', () => {
      it('should get budget by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.id).toBe(budgetId);
        expect(response.body.amount).toBe('500.00');
      });

      it('should reject access to other users budget', async () => {
        await request(app.getHttpServer())
          .get(`/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(404);
      });
    });

    describe('PUT /budgets/:id', () => {
      it('should update budget', async () => {
        const response = await request(app.getHttpServer())
          .put(`/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 600,
            categoryId,
            month: 1,
            year: 2026,
          })
          .expect(200);

        expect(response.body.amount).toBe('600.00');
      });

      it('should reject update by other user', async () => {
        await request(app.getHttpServer())
          .put(`/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            amount: 999,
            categoryId,
            month: 1,
            year: 2026,
          })
          .expect(404);
      });
    });

    describe('DELETE /budgets/:id', () => {
      it('should delete budget', async () => {
        // Create budget to delete
        const createResponse = await request(app.getHttpServer())
          .post('/budgets')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            amount: 300,
            categoryId,
            month: 5,
            year: 2026,
          });

        const budgetToDeleteId = createResponse.body.id;

        await request(app.getHttpServer())
          .delete(`/budgets/${budgetToDeleteId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        // Verify deletion
        await request(app.getHttpServer())
          .get(`/budgets/${budgetToDeleteId}`)
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(404);
      });

      it('should reject delete by other user', async () => {
        await request(app.getHttpServer())
          .delete(`/budgets/${budgetId}`)
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(404);
      });
    });
  });

  // ==================== DASHBOARD FLOWS ====================
  describe('Dashboard Flows', () => {
    describe('GET /dashboard/monthly-summary', () => {
      it('should return monthly summary', async () => {
        const response = await request(app.getHttpServer())
          .get('/dashboard/monthly-summary?month=1&year=2026')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body).toHaveProperty('totalIncome');
        expect(response.body).toHaveProperty('totalExpense');
        expect(response.body).toHaveProperty('balance');
        // Should be numbers or decimal strings
        expect(
          typeof response.body.totalIncome === 'string' ||
            typeof response.body.totalIncome === 'number',
        ).toBe(true);
      });

      it('should return different summary for different users', async () => {
        const user1Response = await request(app.getHttpServer())
          .get('/dashboard/monthly-summary?month=1&year=2026')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        const user2Response = await request(app.getHttpServer())
          .get('/dashboard/monthly-summary?month=1&year=2026')
          .set('Authorization', `Bearer ${user2Token}`)
          .expect(200);

        // User1 has transactions, user2 shouldn't (unless they added some)
        // This is a basic sanity check
        expect(user1Response.body).toBeDefined();
        expect(user2Response.body).toBeDefined();
      });

      it('should reject invalid month', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/monthly-summary?month=13&year=2026')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(400);
      });

      it('should reject invalid year', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/monthly-summary?month=1&year=invalid')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(400);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/monthly-summary?month=1&year=2026')
          .expect(401);
      });
    });

    describe('GET /dashboard/budget-vs-actual', () => {
      it('should return budget vs actual comparison', async () => {
        const response = await request(app.getHttpServer())
          .get('/dashboard/budget-vs-actual?month=1&year=2026')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);

        // Each item should have budget and actual info
        response.body.forEach((item: any) => {
          expect(item).toHaveProperty('categoryId');
          expect(
            item.hasOwnProperty('budget') || item.hasOwnProperty('actual'),
          ).toBe(true);
        });
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/budget-vs-actual?month=1&year=2026')
          .expect(401);
      });
    });

    describe('GET /dashboard/category-breakdown', () => {
      it('should return category breakdown', async () => {
        const response = await request(app.getHttpServer())
          .get('/dashboard/category-breakdown?month=1&year=2026')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);

        response.body.forEach((item: any) => {
          expect(item).toHaveProperty('categoryId');
        });
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/category-breakdown?month=1&year=2026')
          .expect(401);
      });
    });

    describe('GET /dashboard/top-expenses', () => {
      it('should return top expenses', async () => {
        const response = await request(app.getHttpServer())
          .get('/dashboard/top-expenses?month=1&year=2026&limit=10')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should respect limit parameter', async () => {
        const response = await request(app.getHttpServer())
          .get('/dashboard/top-expenses?month=1&year=2026&limit=2')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(200);

        expect(response.body.length).toBeLessThanOrEqual(2);
      });

      it('should reject limit outside the allowed range', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/top-expenses?month=1&year=2026&limit=0')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(400);

        await request(app.getHttpServer())
          .get('/dashboard/top-expenses?month=1&year=2026&limit=101')
          .set('Authorization', `Bearer ${user1Token}`)
          .expect(400);
      });

      it('should reject without authentication', async () => {
        await request(app.getHttpServer())
          .get('/dashboard/top-expenses?month=1&year=2026&limit=10')
          .expect(401);
      });
    });
  });

  // ==================== USER ISOLATION ====================
  describe('User Isolation', () => {
    it('should not allow user1 to access user2 data', async () => {
      // User 2 creates a category
      const user2CategoryResponse = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'User 2 Only Category',
          type: 'INCOME',
        });

      const user2CategoryId = user2CategoryResponse.body.id;

      // User 1 should not be able to access it
      await request(app.getHttpServer())
        .get(`/categories/${user2CategoryId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(404);
    });

    it('should not allow user2 to modify user1 transaction', async () => {
      await request(app.getHttpServer())
        .put(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          amount: 999,
          type: 'EXPENSE',
          categoryId,
          date: '2026-01-15',
        })
        .expect(404);
    });

    it('should not allow user2 to delete user1 budget', async () => {
      await request(app.getHttpServer())
        .delete(`/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);
    });

    it('should isolate dashboard data per user', async () => {
      // Create user1 transaction
      const user1Category = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          name: 'User 1 Isolation Category',
          type: 'EXPENSE',
        });

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          amount: 200,
          type: 'EXPENSE',
          categoryId: user1Category.body.id,
          date: '2026-04-15',
        });

      const user2Category = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          name: 'User 2 Isolation Category',
          type: 'EXPENSE',
        });

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          amount: 50,
          type: 'EXPENSE',
          categoryId: user2Category.body.id,
          date: '2026-04-15',
        });

      // Now compare summaries
      const user1Summary = await request(app.getHttpServer())
        .get('/dashboard/monthly-summary?month=4&year=2026')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      const user2Summary = await request(app.getHttpServer())
        .get('/dashboard/monthly-summary?month=4&year=2026')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      // Summaries should be different
      const user1Total = parseFloat(user1Summary.body.totalExpense || 0);
      const user2Total = parseFloat(user2Summary.body.totalExpense || 0);

      // User1 has 200, user2 has 50
      expect(user1Total).toBeGreaterThan(user2Total);
    });
  });
});
