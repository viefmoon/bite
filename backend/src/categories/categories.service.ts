import { Inject, Injectable } from '@nestjs/common';
import { CategoryRepository } from './infrastructure/persistence/category.repository';
import { CATEGORY_REPOSITORY } from '../common/tokens';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './domain/category';
import { FindAllCategoriesDto } from './dto/find-all-categories.dto';
import { BaseCrudService } from '../common/application/base-crud.service';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class CategoriesService extends BaseCrudService<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  FindAllCategoriesDto
> {
  constructor(@Inject(CATEGORY_REPOSITORY) repo: CategoryRepository) {
    super(repo);
  }

  // Los métodos CRUD (create, findAll, findOne, update, remove) son heredados de BaseCrudService

  async findAllPaginated(filter?: FindAllCategoriesDto): Promise<Paginated<Category>> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    
    // Usar el método findAll heredado para obtener todos los registros
    const allItems = await this.findAll(filter);
    
    // Crear respuesta paginada
    return new Paginated(allItems, allItems.length, page, limit);
  }

  /**  --- lógica extra propia del dominio --- */
  async getFullMenu(): Promise<Category[]> {
    return (this.repo as CategoryRepository).findFullMenu();
  }
}
