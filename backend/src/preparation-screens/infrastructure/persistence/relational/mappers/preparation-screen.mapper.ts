import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PreparationScreen } from '../../../../domain/preparation-screen';
import { PreparationScreenEntity } from '../entities/preparation-screen.entity';
import { ProductMapper } from '../../../../../products/infrastructure/persistence/relational/mappers/product.mapper';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';
import {
  BaseMapper,
  mapArray,
} from '../../../../../common/mappers/base.mapper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Injectable()
export class PreparationScreenMapper extends BaseMapper<
  PreparationScreenEntity,
  PreparationScreen
> {
  constructor(
    @Inject(forwardRef(() => ProductMapper))
    private readonly productMapper: ProductMapper,
    @Inject(forwardRef(() => UserMapper))
    private readonly userMapper: UserMapper,
  ) {
    super();
  }

  override toDomain(entity: PreparationScreenEntity): PreparationScreen | null {
    if (!entity) return null;
    const domain = new PreparationScreen();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.isActive = entity.isActive;
    domain.products = mapArray(entity.products, (p) =>
      this.productMapper.toDomain(p),
    );
    // Mapear usuarios
    domain.users = mapArray(entity.users, (u) => this.userMapper.toDomain(u));
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: PreparationScreen): PreparationScreenEntity | null {
    if (!domain) return null;
    const entity = new PreparationScreenEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.isActive = domain.isActive;

    if (domain.products) {
      entity.products = mapArray(
        domain.products,
        (p) => this.productMapper.toEntity(p) as ProductEntity,
      );
    }

    return entity;
  }
}
