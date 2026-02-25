import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
      where: { id },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.toApiCategory(category);
  }

  async createCategory(createCategoryDto: CreateCategoryDto, userId: string) {
    try {
      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          type: this.normalizeCategoryType(createCategoryDto.type),
          userId,
        },
      });
      return this.toApiCategory(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Category with name "${createCategoryDto.name}" and type "${createCategoryDto.type}" already exists`,
        );
      }
      throw error;
    }
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

    try {
      const category = await this.prisma.category.update({
        where: { id },
        data,
      });
      return this.toApiCategory(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Category with name "${updateCategoryDto.name}" and type "${updateCategoryDto.type}" already exists`,
        );
      }
      throw error;
    }
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
    return category;
  }

  private async ensureCategoryExists(id: string, userId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!category || category.userId !== userId) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
  }
}
