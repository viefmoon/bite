import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TicketImpressionsController } from './ticket-impressions.controller';
import { OrderSubscriber } from './infrastructure/persistence/relational/subscribers/order.subscriber';
import { OrderChangeLogService } from './order-change-log.service';
import { UsersModule } from '../users/users.module';
import { TablesModule } from '../tables/tables.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProductsModule } from '../products/products.module';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { ProductModifiersModule } from '../product-modifiers/product-modifiers.module';
import { RelationalOrderPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { CommonModule } from '../common/common.module';
import { CustomersModule } from '../customers/customers.module';
import { PizzaPriceCalculatorService } from './services/pizza-price-calculator.service';

@Module({
  imports: [
    RelationalOrderPersistenceModule,
    CommonModule, // Para acceder a UserContextService
    UsersModule,
    TablesModule,
    PaymentsModule,
    forwardRef(() => ProductsModule),
    forwardRef(() => ProductVariantsModule),
    forwardRef(() => ProductModifiersModule),
    CustomersModule,
  ],
  controllers: [OrdersController, TicketImpressionsController],
  providers: [OrdersService, OrderSubscriber, OrderChangeLogService, PizzaPriceCalculatorService],
  exports: [
    OrdersService,
    OrderChangeLogService,
    RelationalOrderPersistenceModule,
  ],
})
export class OrdersModule {}
