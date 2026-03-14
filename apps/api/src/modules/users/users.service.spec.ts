import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../shared/prisma.service';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcryptjs';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  const userId = 'user-123';

  const mockUser = {
    id: userId,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    refreshToken: 'hashed-refresh',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockProfile = {
    id: userId,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==================== getProfile ====================
  describe('getProfile', () => {
    it('should return user profile without password', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockProfile as any);

      const result = await service.getProfile(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== updateProfile ====================
  describe('updateProfile', () => {
    it('should update user name', async () => {
      const updated = { ...mockProfile, name: 'New Name' };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({ id: userId } as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(updated as any);

      const result = await service.updateProfile(userId, { name: 'New Name' });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { name: 'New Name' },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updatePassword ====================
  describe('updatePassword', () => {
    it('should update password and nullify refreshToken', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(mockUser as any);

      await service.updatePassword(userId, {
        currentPassword: 'OldPassword1',
        newPassword: 'NewPassword1',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'OldPassword1',
        mockUser.password,
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword1', 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'new-hashed-password', refreshToken: null },
      });
    });

    it('should throw UnauthorizedException when current password is wrong', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.updatePassword(userId, {
          currentPassword: 'WrongPassword1',
          newPassword: 'NewPassword1',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updatePassword(userId, {
          currentPassword: 'OldPassword1',
          newPassword: 'NewPassword1',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ==================== updateEmail ====================
  describe('updateEmail', () => {
    it('should update email', async () => {
      const updated = { ...mockProfile, email: 'new@example.com' };
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({ id: userId } as any);
      jest
        .spyOn(prismaService.user, 'update')
        .mockResolvedValue(updated as any);

      const result = await service.updateEmail(userId, {
        email: 'new@example.com',
      });

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { email: 'new@example.com' },
        select: { id: true, name: true, email: true, createdAt: true },
      });
      expect(result).toEqual(updated);
    });

    it('should throw ConflictException on P2002 (duplicate email)', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({ id: userId } as any);

      const p2002Error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '5.0.0' },
      );
      jest.spyOn(prismaService.user, 'update').mockRejectedValue(p2002Error);

      await expect(
        service.updateEmail(userId, { email: 'taken@example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException when user not found', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        service.updateEmail(userId, { email: 'new@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should rethrow non-P2002 errors', async () => {
      jest
        .spyOn(prismaService.user, 'findUnique')
        .mockResolvedValue({ id: userId } as any);

      const unexpectedError = new Error('Database connection failed');
      jest
        .spyOn(prismaService.user, 'update')
        .mockRejectedValue(unexpectedError);

      await expect(
        service.updateEmail(userId, { email: 'new@example.com' }),
      ).rejects.toThrow('Database connection failed');
    });
  });

  // ==================== deleteAccount ====================
  describe('deleteAccount', () => {
    it('should delete user account', async () => {
      jest
        .spyOn(prismaService.user, 'delete')
        .mockResolvedValue(mockUser as any);

      await service.deleteAccount(userId);

      expect(prismaService.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });
  });
});
