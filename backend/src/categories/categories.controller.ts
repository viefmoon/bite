import { Get, HttpCode, HttpStatus, Controller } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { FindAllCategoriesDto } from './dto/find-all-categories.dto';
import { Category } from './domain/category';
import { CrudControllerFactory } from '../common/presentation/crud-controller.factory'; // Importar la factory

const BaseCategoriesController = CrudControllerFactory<
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  FindAllCategoriesDto,
  CategoriesService
>({
  path: 'categories',
  swaggerTag: 'Categorías',
  // Puedes especificar roles aquí si difieren de los defaults de la factory
  // createRoles: [RoleEnum.admin],
  // updateRoles: [RoleEnum.admin],
  // removeRoles: [RoleEnum.admin],
});

@Controller() 
export class CategoriesController extends BaseCategoriesController {
  protected readonly service: CategoriesService;

  @Get('full-menu') 
  @ApiOperation({
    summary:
      'Obtener el menú completo (categorías, subcategorías, productos, modificadores)',
  })
  @HttpCode(HttpStatus.OK) 
  getFullMenu(): Promise<Category[]> { 
    return this.service.getFullMenu();
  }

  // Los endpoints CRUD (POST /, GET /, GET /:id, PATCH /:id, DELETE /:id)
  // son heredados de BaseCategoriesController y ya están decorados.
}
