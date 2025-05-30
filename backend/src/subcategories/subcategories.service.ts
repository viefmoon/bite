import { Inject, Injectable } from '@nestjs/common';
import { SubcategoryRepository } from './infrastructure/persistence/subcategory.repository'; // Keep type for interface
import { SUBCATEGORY_REPOSITORY } from '../common/tokens';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './domain/subcategory';
import { FindAllSubcategoriesDto } from './dto/find-all-subcategories.dto';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class SubcategoriesService {
  constructor(
    @Inject(SUBCATEGORY_REPOSITORY)
    private readonly subcategoryRepository: SubcategoryRepository,
  ) {}

  async create(
    createSubcategoryDto: CreateSubcategoryDto,
  ): Promise<Subcategory> {
    const subcategory = new Subcategory();
    subcategory.name = createSubcategoryDto.name;
    subcategory.description = createSubcategoryDto.description || null;
    subcategory.isActive = createSubcategoryDto.isActive ?? true;
    subcategory.categoryId = createSubcategoryDto.categoryId;

    if (createSubcategoryDto.photoId) {
      subcategory.photo = {
        id: createSubcategoryDto.photoId,
        path: '',
      };
    }

    return this.subcategoryRepository.create(subcategory);
  }

  async findAll(
    findAllSubcategoriesDto: FindAllSubcategoriesDto,
  ): Promise<Paginated<Subcategory>> {
    return this.subcategoryRepository.findAll({
      page: findAllSubcategoriesDto.page,
      limit: findAllSubcategoriesDto.limit,
      categoryId: findAllSubcategoriesDto.categoryId,
      isActive: findAllSubcategoriesDto.isActive,
    });
  }

  async findOne(id: string): Promise<Subcategory> {
    return this.subcategoryRepository.findOne(id);
  }

  async update(
    id: string,
    updateSubcategoryDto: UpdateSubcategoryDto,
  ): Promise<Subcategory> {
    const existingSubcategory = await this.subcategoryRepository.findOne(id);

    const subcategory = new Subcategory();
    subcategory.id = id;
    subcategory.name = updateSubcategoryDto.name ?? existingSubcategory.name;
    subcategory.description =
      updateSubcategoryDto.description ?? existingSubcategory.description;
    subcategory.isActive =
      updateSubcategoryDto.isActive ?? existingSubcategory.isActive;
    subcategory.categoryId =
      updateSubcategoryDto.categoryId ?? existingSubcategory.categoryId;

    if (updateSubcategoryDto.photoId !== undefined) {
      subcategory.photo = updateSubcategoryDto.photoId
        ? {
            id: updateSubcategoryDto.photoId,
            path: '',
          }
        : null;
    } else if (existingSubcategory.photo) {
      subcategory.photo = {
        id: existingSubcategory.photo.id,
        path: '',
      };
    }

    return this.subcategoryRepository.update(id, subcategory);
  }

  async remove(id: string): Promise<void> {
    return this.subcategoryRepository.softDelete(id);
  }
}
