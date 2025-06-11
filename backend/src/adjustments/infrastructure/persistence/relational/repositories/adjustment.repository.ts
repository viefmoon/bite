import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository';
import { Adjustment } from '../../../../domain/adjustment';
import { FindAllAdjustmentsDto } from '../../../../dto/find-all-adjustments.dto';
import { AdjustmentEntity } from '../entities/adjustment.entity';
import { AdjustmentMapper } from '../mappers/adjustment.mapper';
import { AdjustmentRepository } from '../../adjustment.repository';

@Injectable()
export class AdjustmentRelationalRepository
  extends BaseRelationalRepository<
    AdjustmentEntity,
    Adjustment,
    FindAllAdjustmentsDto
  >
  implements AdjustmentRepository
{
  constructor(
    @InjectRepository(AdjustmentEntity)
    repository: Repository<AdjustmentEntity>,
    mapper: AdjustmentMapper,
  ) {
    super(repository, mapper);
  }

  protected buildWhere(
    filters: FindAllAdjustmentsDto,
  ): FindOptionsWhere<AdjustmentEntity> {
    const where: FindOptionsWhere<AdjustmentEntity> = {};

    if (filters.type) {
      where.type = filters.type;
    }
    if (filters.orderId) {
      where.orderId = filters.orderId;
    }
    if (filters.orderItemId) {
      where.orderItemId = filters.orderItemId;
    }
    if (filters.appliedById) {
      where.appliedById = filters.appliedById;
    }

    return where;
  }

  async findByOrderId(orderId: string): Promise<Adjustment[]> {
    const entities = await this.repository.find({
      where: {
        orderId,
      },
      relations: ['appliedBy'],
      order: {
        appliedAt: 'DESC',
      },
    });

    return this.mapper.mapArray(entities);
  }

  async findByOrderItemId(orderItemId: string): Promise<Adjustment[]> {
    const entities = await this.repository.find({
      where: {
        orderItemId,
      },
      relations: ['appliedBy'],
      order: {
        appliedAt: 'DESC',
      },
    });

    return this.mapper.mapArray(entities);
  }

  async calculateOrderAdjustments(orderId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('adjustment')
      .select('SUM(adjustment.amount)', 'total')
      .where('adjustment.orderId = :orderId', { orderId })
      .andWhere('adjustment.deletedAt IS NULL')
      .getRawOne();

    return Number(result?.total || 0);
  }

  async calculateOrderItemAdjustments(orderItemId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder('adjustment')
      .select('SUM(adjustment.amount)', 'total')
      .where('adjustment.orderItemId = :orderItemId', { orderItemId })
      .andWhere('adjustment.deletedAt IS NULL')
      .getRawOne();

    return Number(result?.total || 0);
  }
}
