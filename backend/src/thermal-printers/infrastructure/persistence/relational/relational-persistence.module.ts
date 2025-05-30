import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThermalPrinterEntity } from './entities/thermal-printer.entity';
import { ThermalPrintersRelationalRepository } from './repositories/thermal-printer.repository';
import { THERMAL_PRINTER_REPOSITORY } from '../../../../common/tokens';
import { ThermalPrinterMapper } from './mappers/thermal-printer.mapper';

@Module({
  imports: [TypeOrmModule.forFeature([ThermalPrinterEntity])],
  providers: [
    {
      provide: THERMAL_PRINTER_REPOSITORY,
      useClass: ThermalPrintersRelationalRepository,
    },
    ThermalPrinterMapper,
  ],
  exports: [THERMAL_PRINTER_REPOSITORY, ThermalPrinterMapper],
})
export class RelationalThermalPrinterPersistenceModule {}
