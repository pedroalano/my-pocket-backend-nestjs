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

  async getAllCategories() {
    const categories = await this.prisma.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => this.toApiCategory(category));
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.toApiCategory(category);
  }

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        type: this.normalizeCategoryType(createCategoryDto.type),
      },
    });

    return this.toApiCategory(category);
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.ensureCategoryExists(id);

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

  async deleteCategory(id: string) {
    await this.ensureCategoryExists(id);

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

  private async ensureCategoryExists(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
