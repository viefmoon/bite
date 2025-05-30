import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Payment } from '../../../../domain/payment';
import { PaymentEntity } from '../entities/payment.entity';
import { OrderEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { OrderMapper } from '../../../../../orders/infrastructure/persistence/relational/mappers/order.mapper';

@Injectable()
export class PaymentMapper extends BaseMapper<PaymentEntity, Payment> {
  constructor(
    @Inject(forwardRef(() => OrderMapper))
    private readonly orderMapper: OrderMapper,
  ) {
    super();
  }

  override toDomain(entity: PaymentEntity): Payment | null {
    if (!entity) return null;
    const domain = new Payment();
    domain.id = entity.id;
    domain.orderId = entity.orderId;
    domain.paymentMethod = entity.paymentMethod;
    domain.amount = entity.amount;
    domain.paymentStatus = entity.paymentStatus;
    domain.order = this.orderMapper.toDomain(entity.order!)!;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: Payment): PaymentEntity | null {
    if (!domain) return null;
    const entity = new PaymentEntity();
    if (domain.id) entity.id = domain.id;
    entity.order = { id: domain.orderId } as OrderEntity;
    entity.paymentMethod = domain.paymentMethod;
    entity.amount = domain.amount;
    entity.paymentStatus = domain.paymentStatus;
    return entity;
  }
}
