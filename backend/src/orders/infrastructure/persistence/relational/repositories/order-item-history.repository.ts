// src/orders/infrastructure/persistence/relational/repositories/order-item-history.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemHistoryEntity } from '../entities/order-item-history.entity';
import { OrderItemHistoryRepository } from '../../order-item-history.repository';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class OrderItemHistoryRelationalRepository
  implements OrderItemHistoryRepository
{
  constructor(
    @InjectRepository(OrderItemHistoryEntity)
    private readonly historyRepository: Repository<OrderItemHistoryEntity>,
  ) {}

  async findByOrderItemId(
    orderItemId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderItemHistoryEntity[], number]> {
    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    return this.historyRepository.findAndCount({
      where: { orderItemId },
      order: { changedAt: 'DESC' }, // Más reciente primero
      skip: skip,
      take: limit,
    });
  }

  async findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderItemHistoryEntity[], number]> {
    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    return this.historyRepository.findAndCount({
      where: { orderId }, // Usar el campo orderId que añadimos
      order: { changedAt: 'DESC' }, // Más reciente primero
      skip: skip,
      take: limit,
    });
  }
}
