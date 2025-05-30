import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TicketImpressionsController } from './ticket-impressions.controller';
import { OrderSubscriber } from './infrastructure/persistence/relational/subscribers/order.subscriber';
import { OrderItemSubscriber } from './infrastructure/persistence/relational/subscribers/order-item.subscriber';
import { OrderChangeLogService } from './order-change-log.service';
import { OrderItemChangeLogService } from './order-item-change-log.service';
import { UsersModule } from '../users/users.module';
import { TablesModule } from '../tables/tables.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProductsModule } from '../products/products.module';
import { ProductVariantsModule } from '../product-variants/product-variants.module';
import { ProductModifiersModule } from '../product-modifiers/product-modifiers.module';
import { RelationalOrderPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalOrderPersistenceModule,
    UsersModule,
    TablesModule,
    PaymentsModule,
    forwardRef(() => ProductsModule),
    forwardRef(() => ProductVariantsModule),
    forwardRef(() => ProductModifiersModule),
  ],
  controllers: [OrdersController, TicketImpressionsController],
  providers: [
    OrdersService,
    OrderSubscriber,
    OrderItemSubscriber,
    OrderChangeLogService,
    OrderItemChangeLogService,
  ],
  exports: [
    OrdersService,
    OrderChangeLogService,
    OrderItemChangeLogService,
    RelationalOrderPersistenceModule,
  ],
})
export class OrdersModule {}
