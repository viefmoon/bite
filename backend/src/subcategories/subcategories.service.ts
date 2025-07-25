import { Inject, Injectable } from '@nestjs/common';
import { SubcategoryRepository } from './infrastructure/persistence/subcategory.repository'; // Keep type for interface
import { SUBCATEGORY_REPOSITORY } from '../common/tokens';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { Subcategory } from './domain/subcategory';
import { FindAllSubcategoriesDto } from './dto/find-all-subcategories.dto';
import { Paginated } from '../common/types/paginated.type';
import {
  CustomIdService,
  EntityPrefix,
} from '../common/services/custom-id.service';

@Injectable()
export class SubcategoriesService {
  constructor(
    @Inject(SUBCATEGORY_REPOSITORY)
    private readonly subcategoryRepository: SubcategoryRepository,
    private readonly customIdService: CustomIdService,
  ) {}

  async create(
    createSubcategoryDto: CreateSubcategoryDto,
  ): Promise<Subcategory> {
    const subcategory = new Subcategory();
    subcategory.id = await this.customIdService.generateId(
      EntityPrefix.SUBCATEGORY,
      'subcategory',
    );
    subcategory.name = createSubcategoryDto.name;
    subcategory.description = createSubcategoryDto.description || null;
    subcategory.isActive = createSubcategoryDto.isActive ?? true;
    subcategory.categoryId = createSubcategoryDto.categoryId;
    subcategory.sortOrder = createSubcategoryDto.sortOrder ?? 0;

    if (createSubcategoryDto.photoId) {
      subcategory.photoId = createSubcategoryDto.photoId;
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
    subcategory.sortOrder =
      updateSubcategoryDto.sortOrder ?? existingSubcategory.sortOrder;

    if (updateSubcategoryDto.photoId !== undefined) {
      subcategory.photoId = updateSubcategoryDto.photoId;
      subcategory.photo = updateSubcategoryDto.photoId
        ? {
            id: updateSubcategoryDto.photoId,
            path: '',
          }
        : null;
    } else if (existingSubcategory.photo) {
      subcategory.photoId = existingSubcategory.photoId;
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

  async findAllByCategoryId(categoryId: string): Promise<Subcategory[]> {
    const result = await this.subcategoryRepository.findAll({
      page: 1,
      limit: 1000, // Un límite alto para obtener todas
      categoryId,
    });
    return result.items;
  }

  async findAllByCategoryIdWithProducts(
    categoryId: string,
  ): Promise<Subcategory[]> {
    // Por ahora retornamos las subcategorías sin productos
    // El componente de frontend obtendrá los productos por separado
    return this.findAllByCategoryId(categoryId);
  }
}
