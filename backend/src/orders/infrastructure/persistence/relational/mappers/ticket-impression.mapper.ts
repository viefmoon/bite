import { Injectable } from '@nestjs/common';
import { OrderEntity } from '../entities/order.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TicketImpression } from '../../../../domain/ticket-impression';
import { TicketImpressionEntity } from '../entities/ticket-impression.entity';
import { OrderMapper } from './order.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class TicketImpressionMapper extends BaseMapper<TicketImpressionEntity, TicketImpression> {
  constructor(
    private readonly orderMapper: OrderMapper,
    private readonly userMapper: UserMapper,
  ) {
    super();
  }

  override toDomain(entity: TicketImpressionEntity): TicketImpression | null {
    if (!entity) return null;
    const domain = new TicketImpression();
    domain.id = entity.id;
    domain.orderId = entity.orderId;
    domain.userId = entity.userId;
    domain.ticketType = entity.ticketType;
    domain.impressionTime = entity.impressionTime;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    domain.order = this.orderMapper.toDomain(entity.order!)!;
    domain.user = this.userMapper.toDomain(entity.user!)!;

    return domain;
  }

  override toEntity(domain: TicketImpression): TicketImpressionEntity | null {
    if (!domain) return null;
    const entity = new TicketImpressionEntity();
    if (domain.id) entity.id = domain.id;
    entity.order = { id: domain.orderId } as OrderEntity;
    entity.user = { id: domain.userId } as UserEntity;
    entity.ticketType = domain.ticketType;
    entity.impressionTime = domain.impressionTime;

    return entity;
  }
}
