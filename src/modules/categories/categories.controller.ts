import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
} from '@nestjs/common';

type categoryDto = {
  name: string;
  type: string;
};

@Controller('categories')
export class CategoriesController {
  @Get()
  getAllCategories() {
    // Logic to get all categories
    return {};
  }

  @Get(':id')
  getCategoryById(@Param('id') id: string) {
    // Logic to get a category by ID
    return { id };
  }

  @Post()
  createCategory(@Body() createCategoryDto: categoryDto) {
    // Logic to create a new category
    console.log(createCategoryDto);
    return createCategoryDto;
  }

  @Put(':id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: categoryDto,
  ) {
    // Logic to update a category by ID
    return { id, ...updateCategoryDto };
  }

  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    // Logic to delete a category by ID
    return { deletedId: id };
  }
}
