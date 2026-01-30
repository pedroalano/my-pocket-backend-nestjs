import { Injectable } from '@nestjs/common';

type CategoryDto = {
  name: string;
  type: string;
};

@Injectable()
export class CategoriesService {
  private categories: { id: string; name: string; type: string }[] = [];

  getAllCategories() {
    return this.categories;
  }

  getCategoryById(id: string) {
    return this.categories.find((category) => category.id === id);
  }

  createCategory(createCategoryDto: CategoryDto) {
    const newCategory = {
      id: (this.categories.length + 1).toString(),
      ...createCategoryDto,
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  updateCategory(id: string, updateCategoryDto: CategoryDto) {
    const categoryIndex = this.categories.findIndex(
      (category) => category.id === id,
    );
    if (categoryIndex > -1) {
      this.categories[categoryIndex] = { id, ...updateCategoryDto };
      return this.categories[categoryIndex];
    }
    return null;
  }

  deleteCategory(id: string) {
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
