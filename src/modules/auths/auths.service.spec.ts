import { Test, TestingModule } from '@nestjs/testing';
import { AuthsService } from './auths.service';
import { PrismaService } from '../shared/prisma.service';

describe('AuthsService', () => {
  let service: AuthsService;
  let prismaService: PrismaService;

  const prismaMock = {
    // Add prisma methods here as needed
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<AuthsService>(AuthsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
