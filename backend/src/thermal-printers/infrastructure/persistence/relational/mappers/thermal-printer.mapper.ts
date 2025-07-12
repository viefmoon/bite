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
    domain.isDefaultPrinter = entity.isDefaultPrinter;
    domain.autoDeliveryPrint = entity.autoDeliveryPrint;
    domain.autoPickupPrint = entity.autoPickupPrint;
    domain.paperWidth = entity.paperWidth;
    domain.charactersPerLine = entity.charactersPerLine;
    domain.cutPaper = entity.cutPaper;
    domain.feedLines = entity.feedLines;
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
    entity.isDefaultPrinter = domain.isDefaultPrinter;
    entity.autoDeliveryPrint = domain.autoDeliveryPrint;
    entity.autoPickupPrint = domain.autoPickupPrint;
    entity.paperWidth = domain.paperWidth;
    entity.charactersPerLine = domain.charactersPerLine;
    entity.cutPaper = domain.cutPaper;
    entity.feedLines = domain.feedLines;

    return entity;
  }
}
