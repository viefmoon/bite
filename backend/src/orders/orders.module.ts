import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderChangeLogService } from './order-change-log.service';
import { OrderChangeTrackerV2Service } from './services/order-change-tracker-v2.service';
import { UsersModule } from '../users/users.module';
import { TablesModule } from '../tables/tables.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProductsModule } from '../products/products.module';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { ProductModifiersModule } from '../product-modifiers/product-modifiers.module';
import { RelationalOrderPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductPersistenceModule } from '../products/infrastructure/persistence/relational/relational-persistence.module';
import { CommonModule } from '../common/common.module';
import { CustomersModule } from '../customers/customers.module';
import { PizzaPriceCalculatorService } from './services/pizza-price-calculator.service';
import { RestaurantConfigModule } from '../restaurant-config/restaurant-config.module';
import { ShiftsModule } from '../shifts/shifts.module';
import { ThermalPrintersModule } from '../thermal-printers/thermal-printers.module';
import { AdjustmentsModule } from '../adjustments/adjustments.module';

@Module({
  imports: [
    RelationalOrderPersistenceModule,
    forwardRef(() => RelationalProductPersistenceModule),
    CommonModule, // Para acceder a UserContextService
    UsersModule,
    TablesModule,
    PaymentsModule,
    forwardRef(() => ProductsModule),
    forwardRef(() => ProductVariantsModule),
    forwardRef(() => ProductModifiersModule),
    CustomersModule,
    RestaurantConfigModule,
    forwardRef(() => ShiftsModule),
    forwardRef(() => ThermalPrintersModule),
    AdjustmentsModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderChangeLogService,
    PizzaPriceCalculatorService,
    OrderChangeTrackerV2Service,
  ],
  exports: [
    OrdersService,
    OrderChangeLogService,
    RelationalOrderPersistenceModule,
  ],
})
export class OrdersModule {}
