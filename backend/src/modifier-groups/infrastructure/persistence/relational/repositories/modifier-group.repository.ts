import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifierGroupEntity } from '../entities/modifier-group.entity';
import { ModifierGroupRepository } from '../../modifier-group.repository';
import { ModifierGroup } from '../../../../domain/modifier-group';
import { FindAllModifierGroupsDto } from '../../../../dto/find-all-modifier-groups.dto';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';
import { ModifierGroupMapper } from '../mappers/modifier-group.mapper';
import { Paginated } from '../../../../../common/types/paginated.type';

@Injectable()
export class ModifierGroupsRelationalRepository
  implements ModifierGroupRepository
{
  constructor(
    @InjectRepository(ModifierGroupEntity)
    private readonly modifierGroupRepository: Repository<ModifierGroupEntity>,
    private readonly modifierGroupMapper: ModifierGroupMapper,
  ) {}

  async create(
    data: Omit<ModifierGroup, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<ModifierGroup> {
    const entity = this.modifierGroupMapper.toEntity(data as ModifierGroup);
    if (!entity) {
      throw new InternalServerErrorException('Error creating modifier group entity');
    }

    const savedEntity = await this.modifierGroupRepository.save(entity);
    const domainResult = this.modifierGroupMapper.toDomain(savedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping saved modifier group entity to domain');
    }
    return domainResult;
  }

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllModifierGroupsDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<Paginated<ModifierGroup>> {
    const page = paginationOptions.page;
    const limit = paginationOptions.limit;
    const skip = (page - 1) * limit;

    const queryBuilder =
      this.modifierGroupRepository.createQueryBuilder('modifierGroup');

    if (filterOptions?.name) {
      queryBuilder.andWhere('modifierGroup.name ILIKE :name', {
        name: `%${filterOptions.name}%`,
      });
    }

    if (filterOptions?.isRequired !== undefined) {
      queryBuilder.andWhere('modifierGroup.isRequired = :isRequired', {
        isRequired: filterOptions.isRequired,
      });
    }

    if (filterOptions?.allowMultipleSelections !== undefined) {
      queryBuilder.andWhere(
        'modifierGroup.allowMultipleSelections = :allowMultipleSelections',
        {
          allowMultipleSelections: filterOptions.allowMultipleSelections,
        },
      );
    }

    if (filterOptions?.isActive !== undefined) {
      queryBuilder.andWhere('modifierGroup.isActive = :isActive', {
        isActive: filterOptions.isActive,
      });
    }

    queryBuilder.skip(skip).take(limit);

    const [entities, count] = await queryBuilder.getManyAndCount();

    const domainResults = entities
      .map((entity) => this.modifierGroupMapper.toDomain(entity))
      .filter((item): item is ModifierGroup => item !== null);

    return new Paginated(domainResults, count, page, limit);
  }

  async findById(
    id: ModifierGroup['id'],
  ): Promise<NullableType<ModifierGroup>> {
    const entity = await this.modifierGroupRepository.findOne({
      where: { id },
      relations: ['productModifiers', 'products'],
    });

    return entity ? this.modifierGroupMapper.toDomain(entity) : null;
  }

  async findByName(
    name: ModifierGroup['name'],
  ): Promise<NullableType<ModifierGroup>> {
    const entity = await this.modifierGroupRepository.findOne({
      where: { name },
      relations: ['productModifiers', 'products'],
    });

    return entity ? this.modifierGroupMapper.toDomain(entity) : null;
  }

  async update(
    id: ModifierGroup['id'],
    payload: DeepPartial<ModifierGroup>,
  ): Promise<ModifierGroup | null> {
    const entityToUpdate = this.modifierGroupMapper.toEntity(payload as ModifierGroup);
     if (!entityToUpdate) {
      throw new InternalServerErrorException('Error creating modifier group entity for update');
    }

    await this.modifierGroupRepository.update(id, entityToUpdate);

    const updatedEntity = await this.modifierGroupRepository.findOne({
      where: { id },
      relations: ['productModifiers', 'products'],
    });

    if (!updatedEntity) {
       throw new NotFoundException(`ModifierGroup con ID ${id} no encontrado`);
    }

    const domainResult = this.modifierGroupMapper.toDomain(updatedEntity);
     if (!domainResult) {
      throw new InternalServerErrorException('Error mapping updated modifier group entity to domain');
    }

    return domainResult;
  }

  async remove(id: ModifierGroup['id']): Promise<void> {
     const result = await this.modifierGroupRepository.softDelete(id);
     if (result.affected === 0) {
      throw new NotFoundException(`ModifierGroup con ID ${id} no encontrado`);
    }
  }
}
