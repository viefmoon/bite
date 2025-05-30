import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common'; // Removed Inject
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubcategoryEntity } from '../entities/subcategory.entity';
import { SubcategoryRepository } from '../../subcategory.repository';
import { Subcategory } from '../../../../domain/subcategory';
import { SubcategoryMapper } from '../mappers/subcategory.mapper';
import { Paginated } from '../../../../../common/types/paginated.type';

@Injectable()
export class SubcategoriesRelationalRepository
  implements SubcategoryRepository
{
  constructor(
    @InjectRepository(SubcategoryEntity)
    private readonly subcategoryRepository: Repository<SubcategoryEntity>,
    private readonly subcategoryMapper: SubcategoryMapper, 
  ) {}

  async create(data: Subcategory): Promise<Subcategory> {
    const entity = this.subcategoryMapper.toEntity(data);
    if (!entity) {
      throw new InternalServerErrorException('Error creating subcategory entity');
    }
    const savedEntity = await this.subcategoryRepository.save(entity);
    const domainResult = this.subcategoryMapper.toDomain(savedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping saved subcategory entity to domain');
    }
    return domainResult;
  }

  async findOne(id: string): Promise<Subcategory> {
    const entity = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['photo', 'category'],
    });

    const domainResult = entity ? this.subcategoryMapper.toDomain(entity) : null;
    if (!domainResult) {
      throw new NotFoundException(`Subcategoría con ID ${id} no encontrada`);
    }
    return domainResult;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    isActive?: boolean;
  }): Promise<Paginated<Subcategory>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.subcategoryRepository
      .createQueryBuilder('subcategory')
      .leftJoinAndSelect('subcategory.photo', 'photo')
      .leftJoinAndSelect('subcategory.category', 'category')
      .skip(skip)
      .take(limit);

    if (options?.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: options.categoryId,
      });
    }

    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('subcategory.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    const [entities, count] = await queryBuilder.getManyAndCount();

    const domainResults = entities
      .map((entity) => this.subcategoryMapper.toDomain(entity))
      .filter((item): item is Subcategory => item !== null);

    return new Paginated(domainResults, count, page, limit);
  }

  async update(id: string, data: Subcategory): Promise<Subcategory> {
    const entity = this.subcategoryMapper.toEntity(data);
    if (!entity) {
      throw new InternalServerErrorException(
        'Error creating subcategory entity for update',
      );
    }

    await this.subcategoryRepository.update(id, entity);

    const updatedEntity = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['photo', 'category'],
    });

    if (!updatedEntity) {
      throw new NotFoundException(`Subcategoría con ID ${id} no encontrada`);
    }

    const domainResult = this.subcategoryMapper.toDomain(updatedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping updated subcategory entity to domain');
    }

    return domainResult;
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.subcategoryRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subcategoría con ID ${id} no encontrada`);
    }
  }
}
