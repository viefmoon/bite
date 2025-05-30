import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PreparationScreenEntity } from '../entities/preparation-screen.entity';
import { PreparationScreenRepository } from '../../preparation-screen.repository';
import { PreparationScreen } from '../../../../domain/preparation-screen';
import { PreparationScreenMapper } from '../mappers/preparation-screen.mapper';
import { Paginated } from '../../../../../common/types/paginated.type';

@Injectable()
export class PreparationScreensRelationalRepository
  implements PreparationScreenRepository
{
  constructor(
    @InjectRepository(PreparationScreenEntity)
    private readonly preparationScreenRepository: Repository<PreparationScreenEntity>,
    private readonly preparationScreenMapper: PreparationScreenMapper,
  ) {}

  async create(data: PreparationScreen): Promise<PreparationScreen> {
    const entity = this.preparationScreenMapper.toEntity(data);
    if (!entity) {
      throw new InternalServerErrorException('Error creating preparation screen entity');
    }
    const savedEntity = await this.preparationScreenRepository.save(entity);
    const domainResult = this.preparationScreenMapper.toDomain(savedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping saved preparation screen entity to domain');
    }
    return domainResult;
  }

  async findOne(id: string): Promise<PreparationScreen> {
    const entity = await this.preparationScreenRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    const domainResult = entity ? this.preparationScreenMapper.toDomain(entity) : null;
    if (!domainResult) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }
    return domainResult;
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<Paginated<PreparationScreen>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.preparationScreenRepository
      .createQueryBuilder('preparationScreen')
      .leftJoinAndSelect('preparationScreen.products', 'products')
      .skip(skip)
      .take(limit)
      .orderBy('preparationScreen.name', 'ASC');

    if (options?.isActive !== undefined) {
      queryBuilder.andWhere('preparationScreen.isActive = :isActive', {
        isActive: options.isActive,
      });
    }

    const [entities, count] = await queryBuilder.getManyAndCount();

    const domainResults = entities
      .map((entity) => this.preparationScreenMapper.toDomain(entity))
      .filter((item): item is PreparationScreen => item !== null);

    return new Paginated(domainResults, count, page, limit);
  }

  async update(
    id: string,
    data: PreparationScreen,
  ): Promise<PreparationScreen> {
    const entity = this.preparationScreenMapper.toEntity(data);
    if (!entity) {
      throw new InternalServerErrorException(
        'Error creating preparation screen entity for update',
      );
    }

    await this.preparationScreenRepository.update(id, entity);

    const updatedEntity = await this.preparationScreenRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!updatedEntity) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }

    const domainResult = this.preparationScreenMapper.toDomain(updatedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping updated preparation screen entity to domain');
    }

    return domainResult;
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.preparationScreenRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Preparation screen with ID ${id} not found`);
    }
  }
}
