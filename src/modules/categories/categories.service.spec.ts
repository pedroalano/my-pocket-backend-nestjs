import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../shared/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prismaService: PrismaService;

  const prismaMock = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category', async () => {
    const categoryResponse = {
      id: '1a2b3c4d-0000-0000-0000-000000000000',
      name: 'PayCheck',
      type: 'INCOME',
      createdAt: new Date('2026-02-13T00:00:00.000Z'),
      updatedAt: new Date('2026-02-13T00:00:00.000Z'),
    };

    jest
      .spyOn(prismaService.category, 'create')
      .mockResolvedValue(categoryResponse);

    const category = await service.createCategory({
      name: 'PayCheck',
      type: 'income',
    });
    expect(category).toEqual({
      ...categoryResponse,
      type: 'income',
    });
  });

  it('should get all categories ordered by name', async () => {
    const categoriesResponse = [
      {
        id: 'a',
        name: 'Alpha',
        type: 'INCOME',
        createdAt: new Date('2026-02-13T00:00:00.000Z'),
        updatedAt: new Date('2026-02-13T00:00:00.000Z'),
      },
      {
        id: 'b',
        name: 'Zeta',
        type: 'EXPENSE',
        createdAt: new Date('2026-02-13T00:00:00.000Z'),
        updatedAt: new Date('2026-02-13T00:00:00.000Z'),
      },
    ];

    jest
      .spyOn(prismaService.category, 'findMany')
      .mockResolvedValue(categoriesResponse);

    const categories = await service.getAllCategories();
    expect(prismaService.category.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(categories).toEqual([
      {
        ...categoriesResponse[0],
        type: 'income',
      },
      {
        ...categoriesResponse[1],
        type: 'expense',
      },
    ]);
  });

  it('should get category by id', async () => {
    const categoryResponse = {
      id: '1a2b3c4d-0000-0000-0000-000000000000',
      name: 'PayCheck',
      type: 'INCOME',
      createdAt: new Date('2026-02-13T00:00:00.000Z'),
      updatedAt: new Date('2026-02-13T00:00:00.000Z'),
    };

    jest
      .spyOn(prismaService.category, 'findUnique')
      .mockResolvedValue(categoryResponse);

    const category = await service.getCategoryById(
      '1a2b3c4d-0000-0000-0000-000000000000',
    );

    expect(category).toEqual({
      ...categoryResponse,
      type: 'income',
    });
  });

  it('should throw when category is missing', async () => {
    jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

    await expect(service.getCategoryById('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update a category partially', async () => {
    const existingCategory = {
      id: '1a2b3c4d-0000-0000-0000-000000000000',
      name: 'PayCheck',
      type: 'INCOME',
      createdAt: new Date('2026-02-13T00:00:00.000Z'),
      updatedAt: new Date('2026-02-13T00:00:00.000Z'),
    };

    const updatedCategory = {
      ...existingCategory,
      name: 'Salary',
    };

    jest
      .spyOn(prismaService.category, 'findUnique')
      .mockResolvedValue(existingCategory);
    jest
      .spyOn(prismaService.category, 'update')
      .mockResolvedValue(updatedCategory);

    const result = await service.updateCategory(
      '1a2b3c4d-0000-0000-0000-000000000000',
      { name: 'Salary' },
    );

    expect(result).toEqual({
      ...updatedCategory,
      type: 'income',
    });
  });

  it('should delete a category', async () => {
    const deletedCategory = {
      id: '1a2b3c4d-0000-0000-0000-000000000000',
      name: 'PayCheck',
      type: 'INCOME',
      createdAt: new Date('2026-02-13T00:00:00.000Z'),
      updatedAt: new Date('2026-02-13T00:00:00.000Z'),
    };

    jest
      .spyOn(prismaService.category, 'findUnique')
      .mockResolvedValue({ id: deletedCategory.id } as any);
    jest
      .spyOn(prismaService.category, 'delete')
      .mockResolvedValue(deletedCategory);

    const result = await service.deleteCategory(deletedCategory.id);

    expect(result).toEqual({
      ...deletedCategory,
      type: 'income',
    });
  });
});
