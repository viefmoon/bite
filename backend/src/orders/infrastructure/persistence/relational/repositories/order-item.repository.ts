import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'; // Añadir InternalServerErrorException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity'; // Importar OrderEntity

import { OrderItem } from '../../../../domain/order-item';
import { OrderItemRepository } from '../../order-item.repository';
import { OrderItemEntity } from '../entities/order-item.entity';
import { OrderItemMapper } from '../mappers/order-item.mapper';

@Injectable()
export class OrderItemRelationalRepository implements OrderItemRepository {
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepository: Repository<OrderItemEntity>,
    @InjectRepository(OrderEntity) // Inyectar OrderRepository
    private readonly orderRepository: Repository<OrderEntity>,
    private readonly orderItemMapper: OrderItemMapper, // Inyectar el mapper
  ) {}

  async findById(id: string): Promise<OrderItem | null> {
    const orderItemEntity = await this.orderItemRepository.findOne({
      where: { id },
      relations: ['order', 'modifiers'],
    });

    if (!orderItemEntity) {
      return null;
    }

    return this.orderItemMapper.toDomain(orderItemEntity); // Usar instancia
  }

  async findByOrderId(orderId: string): Promise<OrderItem[]> {
    const orderItemEntities = await this.orderItemRepository.find({
      where: { orderId },
      relations: ['order', 'modifiers'],
    });

    // Usar instancia y filtrar nulos
    return orderItemEntities
      .map((entity) => this.orderItemMapper.toDomain(entity))
      .filter((item): item is OrderItem => item !== null);
  }

  async save(orderItem: OrderItem): Promise<OrderItem> {
    // Buscar la OrderEntity correspondiente
    const orderEntity = await this.orderRepository.findOneBy({
      id: orderItem.orderId,
    });
    if (!orderEntity) {
      throw new NotFoundException(
        `Order with ID ${orderItem.orderId} not found when saving OrderItem`,
      );
    }

    const orderItemEntity = this.orderItemMapper.toEntity(orderItem); // Usar instancia
    if (!orderItemEntity) {
      throw new InternalServerErrorException('Error mapping OrderItem domain to entity for save');
    }
    // No es necesario asignar orderEntity manually si el mapper lo hace correctamente
    // orderItemEntity.order = orderEntity;

    const savedEntity = await this.orderItemRepository.save(orderItemEntity);

    // Recargar para asegurar que las relaciones estén presentes en la respuesta
    const reloadedEntity = await this.orderItemRepository.findOne({
      where: { id: savedEntity.id },
      relations: ['order', 'modifiers', 'product', 'productVariant'], // Cargar relaciones necesarias
    });

    if (!reloadedEntity) {
      throw new InternalServerErrorException( // Usar InternalServerErrorException
        `OrderItem with ID ${savedEntity.id} not found after saving.`,
      );
    }

    const domainResult = this.orderItemMapper.toDomain(reloadedEntity); // Usar instancia
    if (!domainResult) {
      throw new InternalServerErrorException('Error mapping reloaded OrderItem entity to domain');
    }
    return domainResult;
  }

  async update(orderItem: OrderItem): Promise<OrderItem> {
    // Similar a save, asegurar que la relación 'order' esté presente si es necesario
    // aunque 'update' generalmente no cambia las relaciones principales.
    // Por simplicidad y dado que el error es en INSERT, dejamos update como está por ahora,
    // Usar save para actualizar, ya que maneja inserción o actualización basada en ID
    const entityToUpdate = this.orderItemMapper.toEntity(orderItem); // Usar instancia
    if (!entityToUpdate || !entityToUpdate.id) { // Verificar entidad e ID
        throw new InternalServerErrorException('Error mapping OrderItem domain to entity for update or ID missing');
    }

    // Verificar si la entidad existe antes de intentar guardarla (opcional pero bueno)
    const exists = await this.orderItemRepository.existsBy({ id: entityToUpdate.id });
    if (!exists) {
        throw new NotFoundException(`OrderItem with ID ${entityToUpdate.id} not found for update.`);
    }

    // Guardar la entidad mapeada (save actualizará si el ID existe)
    const updatedEntity = await this.orderItemRepository.save(entityToUpdate);

    // Recargar para obtener el estado final con relaciones
    const reloadedEntity = await this.orderItemRepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['order', 'modifiers', 'product', 'productVariant'], // Cargar relaciones necesarias
    });

    if (!reloadedEntity) {
      throw new InternalServerErrorException( // Usar InternalServerErrorException
        `OrderItem with ID ${updatedEntity.id} not found after updating.`,
      );
    }

    const domainResult = this.orderItemMapper.toDomain(reloadedEntity); // Usar instancia
    if (!domainResult) {
        throw new InternalServerErrorException('Error mapping reloaded OrderItem entity to domain after update');
    }
    return domainResult;
  }

  async delete(id: string): Promise<void> {
    await this.orderItemRepository.softDelete(id);
  }
}
