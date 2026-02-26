import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'List of all categories for the authenticated user',
    type: [CategoryDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  getAllCategories(@Request() req: AuthenticatedRequest) {
    return this.categoriesService.getAllCategories(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the category to retrieve',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Category found and returned successfully',
    type: CategoryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  getCategoryById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.getCategoryById(id, req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.createCategory(
      createCategoryDto,
      req.user.userId,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the category to update',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.updateCategory(
      id,
      updateCategoryDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the category to delete',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  deleteCategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.deleteCategory(id, req.user.userId);
  }
}
