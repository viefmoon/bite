import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderPreparationScreenStatus } from '../../../../domain/order-preparation-screen-status';
import { OrderPreparationScreenStatusRepository } from '../../order-preparation-screen-status.repository';
import { OrderPreparationScreenStatusEntity } from '../entities/order-preparation-screen-status.entity';
import { OrderPreparationScreenStatusMapper } from '../mappers/order-preparation-screen-status.mapper';

@Injectable()
export class OrderPreparationScreenStatusRelationalRepository
  implements OrderPreparationScreenStatusRepository
{
  constructor(
    @InjectRepository(OrderPreparationScreenStatusEntity)
    private readonly repository: Repository<OrderPreparationScreenStatusEntity>,
    private readonly mapper: OrderPreparationScreenStatusMapper,
  ) {}

  async create(
    data: Omit<OrderPreparationScreenStatus, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<OrderPreparationScreenStatus> {
    const entity = this.mapper.toEntity(data as OrderPreparationScreenStatus);
    if (!entity) {
      throw new Error('Failed to map domain to entity');
    }

    const newEntity = await this.repository.save(
      this.repository.create(entity),
    );

    const result = this.mapper.toDomain(newEntity);
    if (!result) {
      throw new Error('Failed to map entity to domain');
    }

    return result;
  }

  async findByOrderId(
    orderId: string,
  ): Promise<OrderPreparationScreenStatus[]> {
    const entities = await this.repository.find({
      where: { orderId },
      relations: ['preparationScreen', 'startedBy', 'completedBy'],
    });

    return entities
      .map((entity) => this.mapper.toDomain(entity))
      .filter(
        (domain): domain is OrderPreparationScreenStatus => domain !== null,
      );
  }

  async findByOrderAndScreen(
    orderId: string,
    screenId: string,
  ): Promise<OrderPreparationScreenStatus | null> {
    const entity = await this.repository.findOne({
      where: {
        orderId,
        preparationScreenId: screenId,
      },
      relations: ['preparationScreen', 'startedBy', 'completedBy'],
    });

    return entity ? this.mapper.toDomain(entity) : null;
  }

  async update(
    id: string,
    data: Partial<OrderPreparationScreenStatus>,
  ): Promise<OrderPreparationScreenStatus> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['preparationScreen', 'startedBy', 'completedBy'],
    });

    if (!entity) {
      throw new Error('OrderPreparationScreenStatus not found');
    }

    Object.assign(entity, data);
    const updatedEntity = await this.repository.save(entity);

    const result = this.mapper.toDomain(updatedEntity);
    if (!result) {
      throw new Error('Failed to map entity to domain');
    }

    return result;
  }

  async createOrUpdate(
    orderId: string,
    screenId: string,
    data: Partial<OrderPreparationScreenStatus>,
  ): Promise<OrderPreparationScreenStatus> {
    let entity = await this.repository.findOne({
      where: {
        orderId,
        preparationScreenId: screenId,
      },
    });

    if (entity) {
      Object.assign(entity, data);
      entity = await this.repository.save(entity);
    } else {
      const newData = {
        ...data,
        orderId,
        preparationScreenId: screenId,
      } as OrderPreparationScreenStatus;

      const newEntity = this.mapper.toEntity(newData);
      if (!newEntity) {
        throw new Error('Failed to map domain to entity');
      }

      entity = await this.repository.save(this.repository.create(newEntity));
    }

    const completeEntity = await this.repository.findOne({
      where: { id: entity!.id },
      relations: ['preparationScreen', 'startedBy', 'completedBy'],
    });

    if (!completeEntity) {
      throw new Error('Failed to load complete entity');
    }

    const result = this.mapper.toDomain(completeEntity);
    if (!result) {
      throw new Error('Failed to map entity to domain');
    }

    return result;
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.repository.delete({ orderId });
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete({ id });
  }
}
