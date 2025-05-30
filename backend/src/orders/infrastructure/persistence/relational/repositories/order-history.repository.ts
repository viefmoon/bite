import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderHistoryEntity } from '../entities/order-history.entity';
import { OrderHistoryRepository } from '../../order-history.repository';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class OrderHistoryRelationalRepository
  implements OrderHistoryRepository
{
  constructor(
    @InjectRepository(OrderHistoryEntity)
    private readonly historyRepository: Repository<OrderHistoryEntity>,
  ) {}

  async findByOrderId(
    orderId: string,
    paginationOptions: IPaginationOptions,
  ): Promise<[OrderHistoryEntity[], number]> {
    const { page, limit } = paginationOptions;
    const skip = (page - 1) * limit;

    return this.historyRepository.findAndCount({
      where: { orderId },
      order: { changedAt: 'DESC' },
      skip: skip,
      take: limit,
    });
  }
}
