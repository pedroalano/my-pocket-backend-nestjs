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

  // Test data
  const userId = 'user-123';
  const otherUserId = 'user-456';
  const categoryId = '1a2b3c4d-0000-0000-0000-000000000000';

  const mockCategory = {
    id: categoryId,
    name: 'PayCheck',
    type: 'INCOME',
    userId,
    createdAt: new Date('2026-02-13T00:00:00.000Z'),
    updatedAt: new Date('2026-02-13T00:00:00.000Z'),
  };

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

  it('should create a category with userId', async () => {
    const createDto = {
      name: 'PayCheck',
      type: 'income',
    };

    jest
      .spyOn(prismaService.category, 'create')
      .mockResolvedValue(mockCategory);

    const category = await service.createCategory(createDto, userId);

    expect(prismaService.category.create).toHaveBeenCalledWith({
      data: {
        name: 'PayCheck',
        type: 'INCOME',
        userId,
      },
    });

    expect(category).toEqual({
      ...mockCategory,
      type: 'income',
    });
  });

  it('should get all categories filtered by userId', async () => {
    const categoriesResponse = [
      {
        ...mockCategory,
        name: 'Alpha',
      },
      {
        ...mockCategory,
        id: 'other-id',
        name: 'Zeta',
        type: 'EXPENSE',
      },
    ];

    jest
      .spyOn(prismaService.category, 'findMany')
      .mockResolvedValue(categoriesResponse);

    const categories = await service.getAllCategories(userId);

    expect(prismaService.category.findMany).toHaveBeenCalledWith({
      where: { userId },
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

  it('should get category by id when user is owner', async () => {
    jest
      .spyOn(prismaService.category, 'findUnique')
      .mockResolvedValue(mockCategory);

    const category = await service.getCategoryById(categoryId, userId);

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId },
    });

    expect(category).toEqual({
      ...mockCategory,
      type: 'income',
    });
  });

  it('should throw NotFoundException when category not found or user not owner', async () => {
    jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

    await expect(service.getCategoryById(categoryId, userId)).rejects.toThrow(
      NotFoundException,
    );

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId },
    });
  });

  it('should throw NotFoundException when user tries to access another users category', async () => {
    jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

    await expect(
      service.getCategoryById(categoryId, otherUserId),
    ).rejects.toThrow(NotFoundException);

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId: otherUserId },
    });
  });

  it('should update a category partially with owner validation', async () => {
    const updatedCategory = {
      ...mockCategory,
      name: 'Salary',
    };

    jest
      .spyOn(prismaService.category, 'findUnique')
      .mockResolvedValue(mockCategory);
    jest
      .spyOn(prismaService.category, 'update')
      .mockResolvedValue(updatedCategory);

    const result = await service.updateCategory(
      categoryId,
      { name: 'Salary' },
      userId,
    );

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId },
      select: { id: true },
    });

    expect(result).toEqual({
      ...updatedCategory,
      type: 'income',
    });
  });

  it('should throw NotFoundException when user tries to update another users category', async () => {
    jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

    await expect(
      service.updateCategory(categoryId, { name: 'Salary' }, otherUserId),
    ).rejects.toThrow(NotFoundException);

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId: otherUserId },
      select: { id: true },
    });
  });

  it('should delete a category with owner validation', async () => {
    const deletedCategory = mockCategory;

    jest
      .spyOn(prismaService.category, 'findUnique')
      .mockResolvedValue({ id: categoryId } as any);
    jest
      .spyOn(prismaService.category, 'delete')
      .mockResolvedValue(deletedCategory);

    const result = await service.deleteCategory(categoryId, userId);

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId },
      select: { id: true },
    });

    expect(prismaService.category.delete).toHaveBeenCalledWith({
      where: { id: categoryId },
    });

    expect(result).toEqual({
      ...deletedCategory,
      type: 'income',
    });
  });

  it('should throw NotFoundException when user tries to delete another users category', async () => {
    jest.spyOn(prismaService.category, 'findUnique').mockResolvedValue(null);

    await expect(
      service.deleteCategory(categoryId, otherUserId),
    ).rejects.toThrow(NotFoundException);

    expect(prismaService.category.findUnique).toHaveBeenCalledWith({
      where: { id: categoryId, userId: otherUserId },
      select: { id: true },
    });
  });
});
