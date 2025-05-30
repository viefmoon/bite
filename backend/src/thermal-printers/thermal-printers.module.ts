import { Module } from '@nestjs/common';
import { ThermalPrintersController } from './thermal-printers.controller';
import { ThermalPrintersService } from './thermal-printers.service';
import { RelationalThermalPrinterPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AuthModule } from '../auth/auth.module';
import { PrintingController } from './printing.controller';
import { PrintingService } from './printing.service';
import { OrdersModule } from '../orders/orders.module';
import { DiscoveryService } from './discovery.service';

const infrastructurePersistenceModule =
  RelationalThermalPrinterPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    AuthModule,
    OrdersModule,
  ],
  controllers: [ThermalPrintersController, PrintingController],
  providers: [ThermalPrintersService, PrintingService, DiscoveryService],
  exports: [ThermalPrintersService, infrastructurePersistenceModule],
})
export class ThermalPrintersModule {}
