import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, apiRequest, ApiException } from './api';
import { mockToken } from '@/test/mocks/handlers';

describe('api', () => {
  beforeEach(() => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
  });

  describe('apiRequest', () => {
    it('should add Authorization header when token exists', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(mockToken);

      const result = await api.get('/categories');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not add Authorization header when no token', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      await expect(api.get('/categories')).rejects.toThrow(ApiException);
    });

    it('should throw ApiException on 401 error', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      try {
        await api.get('/categories');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).statusCode).toBe(401);
        expect((error as ApiException).message).toBe('Unauthorized');
      }
    });

    it('should throw ApiException on invalid credentials', async () => {
      try {
        await api.post('/auths/login', {
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).statusCode).toBe(401);
      }
    });

    it('should return data on successful login', async () => {
      const result = await api.post<{ access_token: string }>('/auths/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.access_token).toBe(mockToken);
    });

    it('should handle 204 No Content response', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(mockToken);

      const result = await api.delete('/categories/cat-1');

      expect(result).toBeUndefined();
    });
  });

  describe('api methods', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue(mockToken);
    });

    it('api.get should make GET request', async () => {
      const result = await api.get('/categories');
      expect(Array.isArray(result)).toBe(true);
    });

    it('api.post should make POST request with data', async () => {
      const result = await api.post<{ id: string; name: string }>(
        '/categories',
        {
          name: 'Test Category',
          type: 'INCOME',
        },
      );

      expect(result.id).toBe('new-cat-id');
      expect(result.name).toBe('Test Category');
    });

    it('api.put should make PUT request with data', async () => {
      const result = await api.put<{ name: string }>('/categories/cat-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('api.delete should make DELETE request', async () => {
      const result = await api.delete('/categories/cat-1');
      expect(result).toBeUndefined();
    });
  });

  describe('ApiException', () => {
    it('should create exception with status code and message', () => {
      const exception = new ApiException(404, 'Not found');

      expect(exception.statusCode).toBe(404);
      expect(exception.message).toBe('Not found');
      expect(exception.name).toBe('ApiException');
    });

    it('should be instanceof Error', () => {
      const exception = new ApiException(500, 'Server error');
      expect(exception).toBeInstanceOf(Error);
    });
  });
});
