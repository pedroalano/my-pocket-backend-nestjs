import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategoriesService],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a category', () => {
    const category = service.createCategory({
      name: 'PayCheck',
      type: 'income',
    });
    expect(category).toEqual({ id: 1, name: 'PayCheck', type: 'income' });
  });

  it('should get all categories', () => {
    service.createCategory({ name: 'PayCheck', type: 'income' });
    const categories = service.getAllCategories();
    expect(categories.length).toBe(1);
  });

  it('should get category by id', () => {
    service.createCategory({ name: 'PayCheck', type: 'income' });
    const category = service.getCategoryById(1);
    expect(category).toEqual({ id: 1, name: 'PayCheck', type: 'income' });
  });

  it('should update a category', () => {
    service.createCategory({ name: 'PayCheck', type: 'income' });
    const updatedCategory = service.updateCategory(1, {
      name: 'Salary',
      type: 'income',
    });
    expect(updatedCategory).toEqual({ id: 1, name: 'Salary', type: 'income' });
  });

  it('should delete a category', () => {
    service.createCategory({ name: 'PayCheck', type: 'income' });
    const deletedCategory = service.deleteCategory(1);
    expect(deletedCategory).toEqual({
      id: 1,
      name: 'PayCheck',
      type: 'income',
    });
    const categories = service.getAllCategories();
    expect(categories.length).toBe(0);
  });
});
