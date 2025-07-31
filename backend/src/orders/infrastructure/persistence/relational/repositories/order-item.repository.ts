import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';

import { OrderItem } from '../../../../domain/order-item';
import { OrderItemRepository } from '../../order-item.repository';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderItemMapper } from '../mappers/order-item.mapper';

@Injectable()
export class OrderItemRelationalRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(OrderEntity)
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly orderItemMapper: OrderItemMapper,
  ) {}

  async findById(id: string): Promise<OrderItem | null> {
    const orderItemEntity = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'productModifiers', 'selectedPizzaCustomizations'],
    });

    if (!orderItemEntity) {
      return null;
    }

    return this.orderItemMapper.toDomain(orderItemEntity);
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const orderItemEntities = await this.orderItemRepository.find({
      where: { orderId },
      relations: ['order', 'productModifiers', 'selectedPizzaCustomizations'],
    });

    return orderItemEntities
      .map((entity) => this.orderItemMapper.toDomain(entity))
      .filter((item): item is OrderItem => item !== null);
  }

  async save(orderItem: OrderItem): Promise<OrderItem> {
    const orderEntity = await this.orderRepository.findOneBy({
      id: orderItem.orderId,
    });
    if (!orderEntity) {
      throw new NotFoundException(
        `Order with ID ${orderItem.orderId} not found when saving OrderItem`,
      );
    }

    const orderItemEntity = this.orderItemMapper.toEntity(orderItem);
    if (!orderItemEntity) {
      throw new InternalServerErrorException(
        'Error mapping OrderItem domain to entity for save',
      );
    }

    const savedEntity = await this.orderItemRepository.save(orderItemEntity);

    const reloadedEntity = await this.orderItemRepository.findOne({
      where: { id: savedEntity.id },
      relations: [
        'order',
        'productModifiers',
        'product',
        'productVariant',
        'selectedPizzaCustomizations',
      ],
    });

    if (!reloadedEntity) {
      throw new InternalServerErrorException(
        `OrderItem with ID ${savedEntity.id} not found after saving.`,
      );
    }

    const domainResult = this.orderItemMapper.toDomain(reloadedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping reloaded OrderItem entity to domain',
      );
    }
    return domainResult;
  }

  async update(orderItem: OrderItem): Promise<OrderItem> {
    const entityToUpdate = this.orderItemMapper.toEntity(orderItem);
    if (!entityToUpdate || !entityToUpdate.id) {
      throw new InternalServerErrorException(
        'Error mapping OrderItem domain to entity for update or ID missing',
      );
    }

    const exists = await this.orderItemRepository.existsBy({
      id: entityToUpdate.id,
    });
    if (!exists) {
      throw new NotFoundException(
        `OrderItem with ID ${entityToUpdate.id} not found for update.`,
      );
    }

    const updatedEntity = await this.orderItemRepository.save(entityToUpdate);

    const reloadedEntity = await this.orderItemRepository.findOne({
      where: { id: updatedEntity.id },
      relations: [
        'order',
        'productModifiers',
        'product',
        'productVariant',
        'selectedPizzaCustomizations',
      ],
    });

    if (!reloadedEntity) {
      throw new InternalServerErrorException(
        `OrderItem with ID ${updatedEntity.id} not found after updating.`,
      );
    }

    const domainResult = this.orderItemMapper.toDomain(reloadedEntity);
    if (!domainResult) {
      throw new InternalServerErrorException(
        'Error mapping reloaded OrderItem entity to domain after update',
      );
    }
    return domainResult;
  }

  async delete(id: string): Promise<void> {
    await this.orderItemRepository.softDelete(id);
  }

  async deletePizzaCustomizations(orderItemId: string): Promise<void> {
    await this.orderItemRepository
      .createQueryBuilder()
      .delete()
      .from('selected_pizza_customization')
      .where('order_item_id = :orderItemId', { orderItemId })
      .execute();
  }

  async createPizzaCustomizations(customizations: any[]): Promise<void> {
    if (customizations.length === 0) return;

    await this.orderItemRepository
      .createQueryBuilder()
      .insert()
      .into('selected_pizza_customization')
      .values(customizations)
      .execute();
  }
}
