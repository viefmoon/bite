import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { DailyOrderCounterEntity } from './entities/daily-order-counter.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { TicketImpressionEntity } from './entities/ticket-impression.entity';
import { OrderHistoryEntity } from './entities/order-history.entity';
import { DeliveryInfoEntity } from './entities/delivery-info.entity';
import { OrdersRelationalRepository } from './repositories/order.repository';
import { DailyOrderCounterRelationalRepository } from './repositories/daily-order-counter.repository';
import { OrderItemRelationalRepository } from './repositories/order-item.repository';
import { TicketImpressionRelationalRepository } from './repositories/ticket-impression-relational.repository';
import { OrderHistoryRelationalRepository } from './repositories/order-history.repository';
import { OrderMapper } from './mappers/order.mapper';
import { DailyOrderCounterMapper } from './mappers/daily-order-counter.mapper';
import { OrderItemMapper } from './mappers/order-item.mapper';
import { TicketImpressionMapper } from './mappers/ticket-impression.mapper';
import { DeliveryInfoMapper } from './mappers/delivery-info.mapper';
import {
  ORDER_REPOSITORY,
  DAILY_ORDER_COUNTER_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  TICKET_IMPRESSION_REPOSITORY,
  ORDER_HISTORY_REPOSITORY,
} from '../../../../common/tokens';
import { RelationalUserPersistenceModule } from '../../../../users/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalTablePersistenceModule } from '../../../../tables/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalPaymentPersistenceModule } from '../../../../payments/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductVariantPersistenceModule } from '../../../../product-variants/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductModifierPersistenceModule } from '../../../../product-modifiers/infrastructure/persistence/relational/relational-persistence.module';
import { AdjustmentsRelationalPersistenceModule } from '../../../../adjustments/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      DailyOrderCounterEntity,
      OrderItemEntity,
      TicketImpressionEntity,
      OrderHistoryEntity,
      DeliveryInfoEntity,
    ]),
    RelationalUserPersistenceModule,
    RelationalTablePersistenceModule,
    forwardRef(() => RelationalPaymentPersistenceModule), // Usar forwardRef aquí
    RelationalProductPersistenceModule,
    RelationalProductVariantPersistenceModule,
    RelationalProductModifierPersistenceModule,
    forwardRef(() => AdjustmentsRelationalPersistenceModule), // Usar forwardRef para evitar dependencias circulares
  ],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useClass: OrdersRelationalRepository,
    },
    {
      provide: DAILY_ORDER_COUNTER_REPOSITORY,
      useClass: DailyOrderCounterRelationalRepository,
    },
    {
      provide: ORDER_ITEM_REPOSITORY,
      useClass: OrderItemRelationalRepository,
    },
    {
      provide: TICKET_IMPRESSION_REPOSITORY,
      useClass: TicketImpressionRelationalRepository,
    },
    {
      provide: ORDER_HISTORY_REPOSITORY,
      useClass: OrderHistoryRelationalRepository,
    },
    OrderMapper,
    DailyOrderCounterMapper,
    OrderItemMapper,
    TicketImpressionMapper,
    DeliveryInfoMapper,
  ],
  exports: [
    ORDER_REPOSITORY,
    DAILY_ORDER_COUNTER_REPOSITORY,
    ORDER_ITEM_REPOSITORY,
    TICKET_IMPRESSION_REPOSITORY,
    ORDER_HISTORY_REPOSITORY,
    OrderMapper,
    DailyOrderCounterMapper,
    OrderItemMapper,
    TicketImpressionMapper,
    DeliveryInfoMapper,
  ],
})
export class RelationalOrderPersistenceModule {}
