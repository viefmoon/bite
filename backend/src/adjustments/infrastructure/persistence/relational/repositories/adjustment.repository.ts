import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository';
import { Adjustment } from '../../../../domain/adjustment';
import { FindAllAdjustmentsDto } from '../../../../dto/find-all-adjustments.dto';
import { AdjustmentEntity } from '../entities/adjustment.entity';
import { AdjustmentMapper } from '../mappers/adjustment.mapper';
import { AdjustmentRepository } from '../../adjustment.repository';
import { mapArray } from '../../../../../common/mappers/base.mapper';

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
    const entities = await this.ormRepo.find({
      where: {
        orderId,
      },
      relations: ['appliedBy'],
      order: {
        appliedAt: 'DESC',
      },
    });

    return mapArray(entities, (entity) => this.mapper.toDomain(entity));
  }

  async findByOrderItemId(orderItemId: string): Promise<Adjustment[]> {
    const entities = await this.ormRepo.find({
      where: {
        orderItemId,
      },
      relations: ['appliedBy'],
      order: {
        appliedAt: 'DESC',
      },
    });

    return mapArray(entities, (entity) => this.mapper.toDomain(entity));
  }

  async calculateOrderAdjustments(orderId: string): Promise<number> {
    const result = await this.ormRepo
      .createQueryBuilder('adjustment')
      .select('SUM(adjustment.amount)', 'total')
      .where('adjustment.orderId = :orderId', { orderId })
      .andWhere('adjustment.deletedAt IS NULL')
      .getRawOne();

    return Number(result?.total || 0);
  }

  async calculateOrderItemAdjustments(orderItemId: string): Promise<number> {
    const result = await this.ormRepo
      .createQueryBuilder('adjustment')
      .select('SUM(adjustment.amount)', 'total')
      .where('adjustment.orderItemId = :orderItemId', { orderItemId })
      .andWhere('adjustment.deletedAt IS NULL')
      .getRawOne();

    return Number(result?.total || 0);
  }
}
