import { Category } from '../../domain/category';
import { IBaseRepository } from '../../../common/domain/repositories/base.repository'; 
import { FindAllCategoriesDto } from '../../dto/find-all-categories.dto';
import { CreateCategoryDto } from '../../dto/create-category.dto'; 
import { UpdateCategoryDto } from '../../dto/update-category.dto'; 

export interface CategoryRepository
  extends IBaseRepository<
    Category,
    FindAllCategoriesDto,
    CreateCategoryDto, 
    UpdateCategoryDto 
  > {
  findFullMenu(): Promise<Category[]>;
}
