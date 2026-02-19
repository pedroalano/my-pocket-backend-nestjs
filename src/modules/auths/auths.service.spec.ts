import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthsService } from './auths.service';
import { PrismaService } from '../shared/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('AuthsService', () => {
  let service: AuthsService;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const prismaMock = {
    user: {
      create: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtServiceMock = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthsService>(AuthsService);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should hash password before saving user', async () => {
      const hashedPassword = 'hashedPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);
      jwtServiceMock.signAsync.mockResolvedValue('mock.token');

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: hashedPassword,
        },
      });
    });

    it('should create user and return JWT token', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken';
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);
      jwtServiceMock.signAsync.mockResolvedValue(mockToken);

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: mockToken });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prismaService.user.create as jest.Mock).mockRejectedValue({
        code: 'P2002',
        meta: { target: ['email'] },
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already exists',
      );
    });

    it('should return only access_token without user data', async () => {
      const mockToken = 'token.jwt.value';
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (prismaService.user.create as jest.Mock).mockResolvedValue(mockUser);
      jwtServiceMock.signAsync.mockResolvedValue(mockToken);

      const result = await service.register(registerDto);

      expect(result).toEqual({ access_token: mockToken });
      expect(result).not.toHaveProperty('user');
      expect(Object.keys(result)).toHaveLength(1);
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token with correct payload', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken';

      jwtServiceMock.signAsync.mockResolvedValue(mockToken);

      const result = await service.generateToken(userId, email);

      expect(result).toEqual({ access_token: mockToken });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        userId,
        email,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(1);
    });

    it('should return token in OAuth2 format', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'user@example.com';
      const mockToken = 'mock.jwt.token';

      jwtServiceMock.signAsync.mockResolvedValue(mockToken);

      const result = await service.generateToken(userId, email);

      expect(result).toHaveProperty('access_token');
      expect(typeof result.access_token).toBe('string');
    });

    it('should include minimal payload with userId and email only', async () => {
      const userId = '456e4567-e89b-12d3-a456-426614174001';
      const email = 'another@example.com';

      jwtServiceMock.signAsync.mockResolvedValue('token');

      await service.generateToken(userId, email);

      const calledPayload = jwtServiceMock.signAsync.mock.calls[0][0];
      expect(Object.keys(calledPayload)).toHaveLength(2);
      expect(calledPayload).toEqual({ userId, email });
    });
  });
});
