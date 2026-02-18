import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthsService } from './auths.service';
import { PrismaService } from '../shared/prisma.service';

describe('AuthsService', () => {
  let service: AuthsService;
  let jwtService: JwtService;

  const prismaMock = {
    // Add prisma methods here as needed
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
