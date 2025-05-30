import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemModifierRepository } from '../../order-item-modifier.repository';
import { OrderItemModifierEntity } from '../entities/order-item-modifier.entity';
import { OrderItemModifier } from '../../../../domain/order-item-modifier';
import { OrderItemModifierMapper } from '../mappers/order-item-modifier.mapper';

@Injectable()
export class OrderItemModifierRelationalRepository
  implements OrderItemModifierRepository
{
  constructor(
    @InjectRepository(OrderItemModifierEntity)
    private readonly orderItemModifierRepository: Repository<OrderItemModifierEntity>,
    private readonly orderItemModifierMapper: OrderItemModifierMapper,
  ) {}

  async findById(id: string): Promise<OrderItemModifier | null> {
    const entity = await this.orderItemModifierRepository.findOne({
      where: { id },
      relations: ['orderItem', 'productModifier'],
    });

    if (!entity) {
      return null;
    }

    const domainResult = this.orderItemModifierMapper.toDomain(entity);
    return domainResult;
  }

  async findByOrderItemId(orderItemId: string): Promise<OrderItemModifier[]> {
    const queryBuilder = this.orderItemModifierRepository
      .createQueryBuilder('oim')
      .leftJoinAndSelect('oim.orderItem', 'oi')
      .leftJoinAndSelect('oim.modifier', 'pm')
      .where('oi.id = :orderItemId', { orderItemId });

    const entities = await queryBuilder.getMany();

    return entities
      .map((entity) => this.orderItemModifierMapper.toDomain(entity))
      .filter((item): item is OrderItemModifier => item !== null);
  }

  async save(orderItemModifier: OrderItemModifier): Promise<OrderItemModifier> {
    const entity = this.orderItemModifierMapper.toEntity(orderItemModifier);
    if (!entity) {
      throw new InternalServerErrorException('Error mapping OrderItemModifier domain to entity for save');
    }
    const savedEntity = await this.orderItemModifierRepository.save(entity);

    const reloadedEntity = await this.orderItemModifierRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['orderItem', 'modifier'],
    });

    if (!reloadedEntity) {
      throw new InternalServerErrorException(`Failed to reload OrderItemModifier with ID ${savedEntity.id} after saving.`);
    }

    const domainResult = this.orderItemModifierMapper.toDomain(reloadedEntity);
    if (!domainResult) {
        throw new InternalServerErrorException('Error mapping reloaded OrderItemModifier entity to domain');
    }
    return domainResult;
  }

  async update(
    orderItemModifier: OrderItemModifier,
  ): Promise<OrderItemModifier> {
    const entity = this.orderItemModifierMapper.toEntity(orderItemModifier);
    if (!entity || !entity.id) {
        throw new InternalServerErrorException('Error mapping OrderItemModifier domain to entity for update or ID missing');
    }
    const updatedEntity = await this.orderItemModifierRepository.save(entity);

    const reloadedEntity = await this.orderItemModifierRepository.findOne({
        where: { id: updatedEntity.id },
        relations: ['orderItem', 'modifier'],
    });

    if (!reloadedEntity) {
        throw new InternalServerErrorException(`Failed to reload OrderItemModifier with ID ${updatedEntity.id} after updating.`);
    }

    const domainResult = this.orderItemModifierMapper.toDomain(reloadedEntity);
    if (!domainResult) {
        throw new InternalServerErrorException('Error mapping reloaded OrderItemModifier entity to domain after update');
    }
    return domainResult;
  }

  async delete(id: string): Promise<void> {
    await this.orderItemModifierRepository.softDelete(id);
  }
}
