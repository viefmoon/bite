import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductModifier } from '../../domain/product-modifier';
import { ProductModifierEntity } from './relational/entities/product-modifier.entity';
import { ProductModifierMapper } from './relational/mappers/product-modifier.mapper';
import { FindAllProductModifiersDto } from '../../dto/find-all-product-modifiers.dto';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { Paginated } from '../../../common/types/paginated.type';

export interface IProductModifierRepository {
  create(data: ProductModifier): Promise<ProductModifier>;
  findById(id: string): Promise<ProductModifier | null>;
  findByGroupId(groupId: string): Promise<ProductModifier[]>;
  findManyWithPagination(options: {
    filterOptions: FindAllProductModifiersDto;
    paginationOptions: IPaginationOptions;
  }): Promise<Paginated<ProductModifier>>;
  update(id: string, data: Partial<ProductModifier>): Promise<ProductModifier | null>;
  remove(id: string): Promise<void>;
}


@Injectable()
export class ProductModifierRepository implements IProductModifierRepository {
  constructor(
    @InjectRepository(ProductModifierEntity)
    private readonly productModifierEntityRepository: Repository<ProductModifierEntity>,
    private readonly productModifierMapper: ProductModifierMapper,
  ) {}

  async create(data: ProductModifier): Promise<ProductModifier> {
    const persistenceModel = this.productModifierMapper.toEntity(data);
     if (!persistenceModel) {
      throw new InternalServerErrorException('Error creating product modifier entity');
    }
    const newEntity =
      await this.productModifierEntityRepository.save(persistenceModel);
    const domainResult = this.productModifierMapper.toDomain(newEntity);
     if (!domainResult) {
      throw new InternalServerErrorException('Error mapping saved product modifier entity to domain');
    }
    return domainResult;
  }

  async findById(id: string): Promise<ProductModifier | null> {
    const entity = await this.productModifierEntityRepository.findOne({
      where: { id },
    });
    const domainResult = entity ? this.productModifierMapper.toDomain(entity) : null;
     if (!domainResult && entity) {
        throw new InternalServerErrorException('Error mapping found product modifier entity to domain');
     }
    return domainResult;
  }

  async findByGroupId(groupId: string): Promise<ProductModifier[]> {
    const entities = await this.productModifierEntityRepository.find({
      where: { groupId },
      order: { sortOrder: 'ASC' },
    });
    const domainResults = entities
      .map((entity) => this.productModifierMapper.toDomain(entity))
      .filter((item): item is ProductModifier => item !== null);
    return domainResults;
  }

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions: FindAllProductModifiersDto;
    paginationOptions: IPaginationOptions;
  }): Promise<Paginated<ProductModifier>> {
    const page = paginationOptions.page || 1;
    const limit = paginationOptions.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.productModifierEntityRepository.createQueryBuilder(
        'product_modifier',
      );

    if (filterOptions.groupId) {
      queryBuilder.andWhere('product_modifier.group_id = :groupId', {
        groupId: filterOptions.groupId,
      });
    }

    if (filterOptions.name) {
      queryBuilder.andWhere('product_modifier.name ILIKE :name', {
        name: `%${filterOptions.name}%`,
      });
    }

    if (filterOptions.isActive !== undefined) {
      queryBuilder.andWhere('product_modifier.is_active = :isActive', {
        isActive: filterOptions.isActive,
      });
    }

    if (filterOptions.isDefault !== undefined) {
      queryBuilder.andWhere('product_modifier.is_default = :isDefault', {
        isDefault: filterOptions.isDefault,
      });
    }

    queryBuilder
      .orderBy('product_modifier.sort_order', 'ASC')
      .addOrderBy('product_modifier.name', 'ASC')
      .skip(skip)
      .take(limit);

    const [entities, count] = await queryBuilder.getManyAndCount();

    const domainResults = entities
      .map((entity) => this.productModifierMapper.toDomain(entity))
      .filter((item): item is ProductModifier => item !== null);

     return new Paginated(domainResults, count, page, limit);
  }

  async update(
    id: string,
    data: Partial<ProductModifier>,
  ): Promise<ProductModifier | null> {
     const entityToUpdate = this.productModifierMapper.toEntity({ ...data, id } as ProductModifier);
     if (!entityToUpdate) {
       throw new InternalServerErrorException('Error creating product modifier entity for update');
     }

    await this.productModifierEntityRepository.update(id, entityToUpdate);

    const updatedEntity = await this.productModifierEntityRepository.findOne({
      where: { id },
    });

     if (!updatedEntity) {
       throw new NotFoundException(`Product modifier with ID ${id} not found after update`);
     }

    const domainResult = this.productModifierMapper.toDomain(updatedEntity);
     if (!domainResult) {
       throw new InternalServerErrorException('Error mapping updated product modifier entity to domain');
     }

    return domainResult;
  }

  async remove(id: string): Promise<void> {
     const result = await this.productModifierEntityRepository.softDelete(id);
     if (result.affected === 0) {
       throw new NotFoundException(`Product modifier with ID ${id} not found`);
     }
  }
}
