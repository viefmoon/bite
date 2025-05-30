import { Injectable } from '@nestjs/common';
import { Area } from '../../../../domain/area';
import { AreaEntity } from '../entities/area.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class AreaMapper extends BaseMapper<AreaEntity, Area> {
  override toDomain(entity: AreaEntity): Area | null {
    if (!entity) return null;
    const domain = new Area();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.description = entity.description;
    domain.isActive = entity.isActive;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: Area): AreaEntity | null {
    if (!domain) return null;
    const entity = new AreaEntity();
    if (domain.id) entity.id = domain.id;
    entity.name = domain.name;
    entity.description = domain.description;
    entity.isActive = domain.isActive;
    return entity;
  }
}
