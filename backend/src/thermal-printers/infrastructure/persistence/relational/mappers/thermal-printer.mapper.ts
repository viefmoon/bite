import { ThermalPrinter } from '../../../../domain/thermal-printer';
import { ThermalPrinterEntity } from '../entities/thermal-printer.entity';

export class ThermalPrinterMapper {
  static toDomain(entity: ThermalPrinterEntity): ThermalPrinter {
    const domain = new ThermalPrinter();
    domain.id = entity.id;
    domain.name = entity.name;
    domain.connectionType = entity.connectionType;
    domain.ipAddress = entity.ipAddress;
    domain.port = entity.port;
    domain.path = entity.path;
    domain.isActive = entity.isActive;
    domain.macAddress = entity.macAddress;
    domain.createdAt = entity.createdAt;
    domain.updatedAt = entity.updatedAt;
    domain.deletedAt = entity.deletedAt;

    return domain;
  }

  static toEntity(domain: ThermalPrinter): ThermalPrinterEntity {
    const entity = new ThermalPrinterEntity();
    entity.id = domain.id;
    entity.name = domain.name;
    entity.connectionType = domain.connectionType;
    entity.ipAddress = domain.ipAddress;
    entity.port = domain.port;
    entity.path = domain.path;
    entity.isActive = domain.isActive;
    entity.macAddress = domain.macAddress;

    return entity;
  }
}
