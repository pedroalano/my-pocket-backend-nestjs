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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  ApiGetAllCategories,
  ApiGetCategoryById,
  ApiCreateCategory,
  ApiCreateCategoryBatch,
  ApiUpdateCategory,
  ApiDeleteCategory,
} from './categories.swagger';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateCategoryBatchDto } from './dto/create-category-batch.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';

@ApiTags('categories')
@Controller('categories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiGetAllCategories()
  getAllCategories(@Request() req: AuthenticatedRequest) {
    return this.categoriesService.getAllCategories(req.user.userId);
  }

  @Get(':id')
  @ApiGetCategoryById()
  getCategoryById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.getCategoryById(id, req.user.userId);
  }

  @Post()
  @ApiCreateCategory()
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.createCategory(
      createCategoryDto,
      req.user.userId,
    );
  }

  @Post('batch')
  @ApiCreateCategoryBatch()
  createCategoryBatch(
    @Body() createCategoryBatchDto: CreateCategoryBatchDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.createCategoryBatch(
      createCategoryBatchDto,
      req.user.userId,
    );
  }

  @Put(':id')
  @ApiUpdateCategory()
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
  @ApiDeleteCategory()
  deleteCategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.deleteCategory(id, req.user.userId);
  }
}
