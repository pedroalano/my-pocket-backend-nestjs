import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { PasswordResetService } from './password-reset.service';
import { PrismaService } from '../shared/prisma.service';

// Mock resend
const mockSendEmail = jest.fn().mockResolvedValue({ id: 'mock-email-id' });
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSendEmail },
  })),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    passwordResetToken: {
      create: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const mockUser = {
    id: 'user-id-123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
  };

  const mockResetToken = {
    id: 'token-id-123',
    userId: 'user-id-123',
    tokenHash: 'some-hash',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    usedAt: null,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockSendEmail.mockClear();

    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: unknown) => {
              if (key === 'resend.apiKey') return 'test-api-key';
              if (key === 'frontend.url') return 'http://localhost:3000';
              if (key === 'resend.fromEmail') return 'noreply@test.com';
              return fallback;
            }),
          },
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  describe('forgotPassword', () => {
    it('returns success message and does NOT create token or send email when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'unknown@example.com',
      });

      expect(result.message).toBe('auth.success.passwordResetEmailSent');
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('generates token and stores hash (not plain token) in DB when user exists', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordResetToken.create.mockResolvedValue(mockResetToken);
      mockSendEmail.mockResolvedValue({ id: 'email-id' });

      await service.forgotPassword({ email: mockUser.email });

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          tokenHash: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });

      const { tokenHash } =
        prisma.passwordResetToken.create.mock.calls[0][0].data;
      // The hash should be a 64-char hex string (SHA-256)
      expect(tokenHash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('sends email to user address with reset link containing plain token', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordResetToken.create.mockResolvedValue(mockResetToken);
      mockSendEmail.mockResolvedValue({ id: 'email-id' });

      await service.forgotPassword({ email: mockUser.email });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          html: expect.stringContaining('reset-password?token='),
        }),
      );

      const { html } = mockSendEmail.mock.calls[0][0];
      const tokenInLink = html.match(/token=([a-f0-9]+)/)?.[1];
      expect(tokenInLink).toBeDefined();
      // Plain token is 64 hex chars (32 bytes as hex)
      expect(tokenInLink).toMatch(/^[a-f0-9]{64}$/);
    });

    it('uses frontend.url from config in the reset link', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.passwordResetToken.create.mockResolvedValue(mockResetToken);
      mockSendEmail.mockResolvedValue({ id: 'email-id' });

      await service.forgotPassword({ email: mockUser.email });

      expect(mockSendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining(
            'http://localhost:3000/reset-password?token=',
          ),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    it('throws BadRequestException when token not found', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'NewPass1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token already used', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue({
        ...mockResetToken,
        usedAt: new Date(),
      });

      await expect(
        service.resetPassword({ token: 'used-token', newPassword: 'NewPass1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when token is expired', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue({
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.resetPassword({
          token: 'expired-token',
          newPassword: 'NewPass1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('calls $transaction with user password update and token usedAt mark on success', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(mockResetToken);
      prisma.$transaction.mockResolvedValue([]);
      prisma.user.update.mockReturnValue('user-update-op');
      prisma.passwordResetToken.update.mockReturnValue('token-update-op');

      await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPass1',
      });

      expect(prisma.$transaction).toHaveBeenCalledWith([
        expect.anything(),
        expect.anything(),
      ]);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockResetToken.userId },
        data: { password: 'hashed-password', refreshToken: null },
      });

      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: mockResetToken.id },
        data: { usedAt: expect.any(Date) },
      });
    });

    it('returns success message on valid reset', async () => {
      prisma.passwordResetToken.findFirst.mockResolvedValue(mockResetToken);
      prisma.$transaction.mockResolvedValue([]);

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPass1',
      });

      expect(result.message).toBe('auth.success.passwordResetSuccess');
    });
  });
});
