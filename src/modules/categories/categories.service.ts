import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, CategoryType } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from '../shared/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories(userId: string) {
    const categories = await this.prisma.category.findMany({
      where: { userId },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => this.toApiCategory(category));
  }

  async getCategoryById(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.toApiCategory(category);
  }

  async createCategory(createCategoryDto: CreateCategoryDto, userId: string) {
    const category = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        type: this.normalizeCategoryType(createCategoryDto.type),
        userId,
      },
    });

    return this.toApiCategory(category);
  }

  async updateCategory(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ) {
    await this.ensureCategoryExists(id, userId);

    const data: { name?: string; type?: CategoryType } = {};

    if (updateCategoryDto.name !== undefined) {
      data.name = updateCategoryDto.name;
    }

    if (updateCategoryDto.type !== undefined) {
      data.type = this.normalizeCategoryType(updateCategoryDto.type);
    }

    const category = await this.prisma.category.update({
      where: { id },
      data,
    });

    return this.toApiCategory(category);
  }

  async deleteCategory(id: string, userId: string) {
    await this.ensureCategoryExists(id, userId);

    const category = await this.prisma.category.delete({
      where: { id },
    });

    return this.toApiCategory(category);
  }

  private normalizeCategoryType(type: string): CategoryType {
    const normalizedType = type?.toUpperCase();

    if (normalizedType !== 'INCOME' && normalizedType !== 'EXPENSE') {
      throw new BadRequestException(`Invalid category type: ${type}`);
    }

    return normalizedType as CategoryType;
  }

  private toApiCategory(category: Category) {
    return {
      ...category,
      type: category.type.toLowerCase(),
    };
  }

  private async ensureCategoryExists(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id, userId },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
