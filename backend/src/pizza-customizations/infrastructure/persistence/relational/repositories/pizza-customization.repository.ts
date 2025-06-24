import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PizzaCustomizationEntity } from '../entities/pizza-customization.entity';
import { PizzaCustomizationMapper } from '../mappers/pizza-customization.mapper';
import { PizzaCustomization } from '../../../../domain/pizza-customization';
import { PizzaCustomizationRepository } from '../../pizza-customization.repository';
import { Paginated } from '../../../../../common/types/paginated.type';

@Injectable()
export class PizzaCustomizationRelationalRepository
  implements PizzaCustomizationRepository
{
  constructor(
    @InjectRepository(PizzaCustomizationEntity)
    private readonly pizzaCustomizationRepository: Repository<PizzaCustomizationEntity>,
    private readonly pizzaCustomizationMapper: PizzaCustomizationMapper,
  ) {}

  async create(
    pizzaCustomization: PizzaCustomization,
  ): Promise<PizzaCustomization> {
    const persistenceModel =
      this.pizzaCustomizationMapper.toEntity(pizzaCustomization);
    if (!persistenceModel) {
      throw new Error('Failed to map pizza customization to entity');
    }

    const newEntity = await this.pizzaCustomizationRepository.save(
      this.pizzaCustomizationRepository.create(persistenceModel),
    );

    const domainResult = this.pizzaCustomizationMapper.toDomain(newEntity);
    if (!domainResult) {
      throw new Error('Failed to map entity to domain');
    }

    return domainResult;
  }

  async findAll(options: {
    page: number;
    limit: number;
    isActive?: boolean;
    type?: string;
  }): Promise<Paginated<PizzaCustomization>> {
    const { page, limit, isActive, type } = options;

    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (type) {
      where.type = type;
    }

    const [entities, total] =
      await this.pizzaCustomizationRepository.findAndCount({
        where,
        relations: ['products'],
        order: {
          sortOrder: 'ASC',
          name: 'ASC',
        },
        skip: (page - 1) * limit,
        take: limit,
      });

    const items = entities
      .map((entity) => this.pizzaCustomizationMapper.toDomain(entity))
      .filter((item): item is PizzaCustomization => item !== null);

    return new Paginated(items, total, page, limit);
  }

  async findById(id: string): Promise<PizzaCustomization | null> {
    const entity = await this.pizzaCustomizationRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!entity) {
      return null;
    }

    return this.pizzaCustomizationMapper.toDomain(entity);
  }

  async findByIds(ids: string[]): Promise<PizzaCustomization[]> {
    const entities = await this.pizzaCustomizationRepository.find({
      where: { id: In(ids) },
      relations: ['products'],
    });

    return entities
      .map((entity) => this.pizzaCustomizationMapper.toDomain(entity))
      .filter((item): item is PizzaCustomization => item !== null);
  }

  async update(
    id: string,
    pizzaCustomization: Partial<PizzaCustomization>,
  ): Promise<PizzaCustomization | null> {
    const result = await this.pizzaCustomizationRepository.update(
      id,
      pizzaCustomization,
    );

    if (result.affected === 0) {
      return null;
    }

    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.pizzaCustomizationRepository.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Pizza customization with ID ${id} not found`,
      );
    }
  }
}
