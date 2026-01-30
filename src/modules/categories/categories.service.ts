import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private categories: { id: number; name: string; type: string }[] = [];

  getAllCategories() {
    return this.categories;
  }

  getCategoryById(id: number) {
    return this.categories.find((category) => category.id === id);
  }

  createCategory(createCategoryDto: CreateCategoryDto) {
    const newCategory = {
      id: this.categories.length + 1,
      ...createCategoryDto,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    const categoryIndex = this.categories.findIndex(
      (category) => category.id === id,
    );
    if (categoryIndex > -1) {
      this.categories[categoryIndex] = { id, ...updateCategoryDto };
      return this.categories[categoryIndex];
    }
    return null;
  }

  deleteCategory(id: number) {
    const categoryIndex = this.categories.findIndex(
      (category) => category.id === id,
    );
    if (categoryIndex > -1) {
      const deletedCategory = this.categories.splice(categoryIndex, 1);
      return deletedCategory[0];
    }
    return null;
  }
}
