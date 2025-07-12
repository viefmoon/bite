import { Injectable } from '@nestjs/common';
import { Shift } from '../../../../domain/shift';
import { ShiftEntity } from '../entities/shift.entity';
import { UserMapper } from '../../../../../users/infrastructure/persistence/relational/mappers/user.mapper';

@Injectable()
export class ShiftMapper {
  constructor(private readonly userMapper: UserMapper) {}

  toDomain(entity: ShiftEntity): Shift | null {
    if (!entity) {
      return null;
    }

    const domain = new Shift();
    domain.id = entity.id;
    domain.date = entity.date;
    domain.globalShiftNumber = entity.globalShiftNumber;
    domain.shiftNumber = entity.shiftNumber;
    domain.openedAt = entity.openedAt;
    domain.closedAt = entity.closedAt;
    domain.openedBy = this.userMapper.toDomain(entity.openedBy)!;
    domain.closedBy = entity.closedBy
      ? this.userMapper.toDomain(entity.closedBy)
      : null;
    domain.initialCash = Number(entity.initialCash);
    domain.finalCash = entity.finalCash ? Number(entity.finalCash) : null;
    domain.totalSales = entity.totalSales ? Number(entity.totalSales) : null;
    domain.totalOrders = entity.totalOrders;
    domain.cashDifference = entity.cashDifference
      ? Number(entity.cashDifference)
      : null;
    domain.status = entity.status;
    domain.notes = entity.notes;
    domain.closeNotes = entity.closeNotes;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    return domain;
  }

  toPersistence(domain: Shift): ShiftEntity {
    const entity = new ShiftEntity();
    entity.id = domain.id;
    entity.date = domain.date;
    entity.globalShiftNumber = domain.globalShiftNumber;
    entity.shiftNumber = domain.shiftNumber;
    entity.openedAt = domain.openedAt;
    entity.closedAt = domain.closedAt;
    const openedByEntity = this.userMapper.toEntity(domain.openedBy);
    if (!openedByEntity) {
      throw new Error('Failed to map openedBy user to entity');
    }
    entity.openedBy = openedByEntity;

    entity.closedBy = domain.closedBy
      ? this.userMapper.toEntity(domain.closedBy)
      : null;
    entity.initialCash = domain.initialCash;
    entity.finalCash = domain.finalCash;
    entity.totalSales = domain.totalSales;
    entity.totalOrders = domain.totalOrders;
    entity.cashDifference = domain.cashDifference;
    entity.status = domain.status;
    entity.notes = domain.notes;
    entity.closeNotes = domain.closeNotes;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    entity.deletedAt = domain.deletedAt;

    return entity;
  }
}
