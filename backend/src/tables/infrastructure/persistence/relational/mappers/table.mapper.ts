import { Injectable } from '@nestjs/common';
import { AreaMapper } from '../../../../../areas/infrastructure/persistence/relational/mappers/area.mapper';
import { Table } from '../../../../domain/table';
import { TableEntity } from '../entities/table.entity';
import { AreaEntity } from '../../../../../areas/infrastructure/persistence/relational/entities/area.entity';
import { BaseMapper } from '../../../../../common/mappers/base.mapper';

@Injectable()
export class TableMapper extends BaseMapper<TableEntity, Table> {
  constructor(private readonly areaMapper: AreaMapper) {
    super();
  }

  override toDomain(entity: TableEntity): Table | null {
    if (!entity) return null;

    if (entity.id && !entity.area) {
      throw new Error(`La tabla ${entity.id} no tiene un área asociada`);
    }

    const domain = new Table();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.areaId = entity.area!.id;
    domain.capacity = entity.capacity;
    domain.isActive = entity.isActive;
    domain.isAvailable = entity.isAvailable;
    domain.isTemporary = entity.isTemporary;
    domain.temporaryIdentifier = entity.temporaryIdentifier;

    domain.area = this.areaMapper.toDomain(entity.area!)!;

    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;
    return domain;
  }

  override toEntity(domain: Table): TableEntity | null {
    if (!domain) return null;
    const entity = new TableEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.area = { id: domain.areaId } as AreaEntity;
    entity.capacity = domain.capacity;
    entity.isActive = domain.isActive;
    entity.isAvailable = domain.isAvailable;
    entity.isTemporary = domain.isTemporary;
    entity.temporaryIdentifier = domain.temporaryIdentifier;
    return entity;
  }
}
