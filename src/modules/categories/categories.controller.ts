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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auths/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auths/interfaces/authenticated-request.interface';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  getAllCategories(@Request() req: AuthenticatedRequest) {
    return this.categoriesService.getAllCategories(req.user.userId);
  }

  @Get(':id')
  getCategoryById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.getCategoryById(id, req.user.userId);
  }

  @Post()
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
  deleteCategory(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.categoriesService.deleteCategory(id, req.user.userId);
  }
}
