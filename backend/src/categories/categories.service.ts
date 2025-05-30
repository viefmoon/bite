import { Inject, Injectable } from '@nestjs/common';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { CATEGORY_REPOSITORY } from '../common/tokens';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './domain/category';
import { FindAllCategoriesDto } from './dto/find-all-categories.dto';
import { BaseCrudService } from '../common/application/base-crud.service';

@Injectable()
export class CategoriesService extends BaseCrudService< 
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  FindAllCategoriesDto
> {
  constructor(
    @Inject(CATEGORY_REPOSITORY) repo: CategoryRepository,
  ) {
    super(repo);
  }

  // Los métodos CRUD (create, findAll, findOne, update, remove) son heredados de BaseCrudService

  /**  --- lógica extra propia del dominio --- */
  async getFullMenu(): Promise<Category[]> {
    return (this.repo as CategoryRepository).findFullMenu();
  }
}
