import { Injectable } from '@nestjs/common';
import { OrderPreparationScreenStatus } from '../../../../domain/order-preparation-screen-status';
import { OrderPreparationScreenStatusEntity } from '../entities/order-preparation-screen-status.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PreparationScreenEntity } from '../../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import { PreparationScreen } from '../../../../../preparation-screens/domain/preparation-screen';

@Injectable()
export class OrderPreparationScreenStatusMapper extends BaseMapper<
  OrderPreparationScreenStatusEntity,
  OrderPreparationScreenStatus
> {
  constructor(private readonly userMapper: UserMapper) {
    super();
  }

  override toDomain(
    entity: OrderPreparationScreenStatusEntity,
  ): OrderPreparationScreenStatus | null {
    if (!entity) return null;

    const domain = new OrderPreparationScreenStatus();
    domain.id = entity.id;
    domain.orderId = entity.orderId;
    domain.preparationScreenId = entity.preparationScreenId;
    domain.status = entity.status;
    domain.startedAt = entity.startedAt;
    domain.completedAt = entity.completedAt;
    domain.startedById = entity.startedById;
    domain.completedById = entity.completedById;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;

    if (entity.startedBy) {
      domain.startedBy = this.userMapper.toDomain(entity.startedBy);
    }

    if (entity.completedBy) {
      domain.completedBy = this.userMapper.toDomain(entity.completedBy);
    }

    if (entity.preparationScreen) {
      const screen = new PreparationScreen();
      screen.id = entity.preparationScreen.id;
      screen.name = entity.preparationScreen.name;
      screen.description = entity.preparationScreen.description;
      screen.isActive = entity.preparationScreen.isActive;
      domain.preparationScreen = screen;
    }

    return domain;
  }

  override toEntity(
    domain: OrderPreparationScreenStatus,
  ): OrderPreparationScreenStatusEntity | null {
    if (!domain) return null;

    const entity = new OrderPreparationScreenStatusEntity();
    if (domain.id) entity.id = domain.id;
    entity.orderId = domain.orderId;
    entity.preparationScreenId = domain.preparationScreenId;
    entity.status = domain.status;
    entity.startedAt = domain.startedAt || null;
    entity.completedAt = domain.completedAt || null;
    entity.startedById = domain.startedById || null;
    entity.completedById = domain.completedById || null;

    if (domain.startedById) {
      entity.startedBy = { id: domain.startedById } as UserEntity;
    }

    if (domain.completedById) {
      entity.completedBy = { id: domain.completedById } as UserEntity;
    }

    if (domain.preparationScreenId) {
      entity.preparationScreen = {
        id: domain.preparationScreenId,
      } as PreparationScreenEntity;
    }

    return entity;
  }
}
