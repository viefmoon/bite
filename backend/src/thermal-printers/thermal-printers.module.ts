import { Module, forwardRef } from '@nestjs/common';
import { ThermalPrintersController } from './thermal-printers.controller';
import { ThermalPrintersService } from './thermal-printers.service';
import { RelationalThermalPrinterPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { AuthModule } from '../auth/auth.module';
import { PrintingController } from './printing.controller';
import { PrintingService } from './printing.service';
import { OrdersModule } from '../orders/orders.module';
import { DiscoveryService } from './discovery.service';
import { AutomaticPrintingService } from './automatic-printing.service';

const infrastructurePersistenceModule =
  RelationalThermalPrinterPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, AuthModule, forwardRef(() => OrdersModule)],
  controllers: [ThermalPrintersController, PrintingController],
  providers: [ThermalPrintersService, PrintingService, DiscoveryService, AutomaticPrintingService],
  exports: [ThermalPrintersService, infrastructurePersistenceModule, AutomaticPrintingService],
})
export class ThermalPrintersModule {}
