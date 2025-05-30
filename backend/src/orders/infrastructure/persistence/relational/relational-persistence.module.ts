import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { DailyOrderCounterEntity } from './entities/daily-order-counter.entity';
import { OrderItemModifierEntity } from './entities/order-item-modifier.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { TicketImpressionEntity } from './entities/ticket-impression.entity';
import { OrderHistoryEntity } from './entities/order-history.entity';
import { OrderItemHistoryEntity } from './entities/order-item-history.entity';
import { OrdersRelationalRepository } from './repositories/order.repository';
import { DailyOrderCounterRelationalRepository } from './repositories/daily-order-counter.repository';
import { OrderItemModifierRelationalRepository } from './repositories/order-item-modifier.repository';
import { OrderItemRelationalRepository } from './repositories/order-item.repository';
import { TicketImpressionRelationalRepository } from './repositories/ticket-impression-relational.repository';
import { OrderHistoryRelationalRepository } from './repositories/order-history.repository';
import { OrderItemHistoryRelationalRepository } from './repositories/order-item-history.repository';
import { OrderMapper } from './mappers/order.mapper';
import { DailyOrderCounterMapper } from './mappers/daily-order-counter.mapper';
import { OrderItemMapper } from './mappers/order-item.mapper';
import { OrderItemModifierMapper } from './mappers/order-item-modifier.mapper';
import { TicketImpressionMapper } from './mappers/ticket-impression.mapper';
import {
  ORDER_REPOSITORY,
  DAILY_ORDER_COUNTER_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  ORDER_ITEM_MODIFIER_REPOSITORY,
  TICKET_IMPRESSION_REPOSITORY,
  ORDER_HISTORY_REPOSITORY,
  ORDER_ITEM_HISTORY_REPOSITORY,
} from '../../../../common/tokens';
import { RelationalUserPersistenceModule } from '../../../../users/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalTablePersistenceModule } from '../../../../tables/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalPaymentPersistenceModule } from '../../../../payments/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductVariantPersistenceModule } from '../../../../product-variants/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductModifierPersistenceModule } from '../../../../product-modifiers/infrastructure/persistence/relational/relational-persistence.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      DailyOrderCounterEntity,
      OrderItemModifierEntity,
      OrderItemEntity,
      TicketImpressionEntity,
      OrderHistoryEntity,
      OrderItemHistoryEntity,
    ]),
    RelationalUserPersistenceModule,
    RelationalTablePersistenceModule,
    forwardRef(() => RelationalPaymentPersistenceModule), // Usar forwardRef aquí
    RelationalProductPersistenceModule,
    RelationalProductVariantPersistenceModule,
    RelationalProductModifierPersistenceModule,
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
      provide: ORDER_ITEM_MODIFIER_REPOSITORY,
      useClass: OrderItemModifierRelationalRepository,
    },
    {
      provide: TICKET_IMPRESSION_REPOSITORY,
      useClass: TicketImpressionRelationalRepository,
    },
    {
      provide: ORDER_HISTORY_REPOSITORY,
      useClass: OrderHistoryRelationalRepository,
    },
    {
      provide: ORDER_ITEM_HISTORY_REPOSITORY,
      useClass: OrderItemHistoryRelationalRepository,
    },
    OrderMapper,
    DailyOrderCounterMapper,
    OrderItemMapper,
    OrderItemModifierMapper,
    TicketImpressionMapper,
  ],
  exports: [
    ORDER_REPOSITORY,
    DAILY_ORDER_COUNTER_REPOSITORY,
    ORDER_ITEM_REPOSITORY,
    ORDER_ITEM_MODIFIER_REPOSITORY,
    TICKET_IMPRESSION_REPOSITORY,
    ORDER_HISTORY_REPOSITORY,
    ORDER_ITEM_HISTORY_REPOSITORY,
    OrderMapper,
    DailyOrderCounterMapper,
    OrderItemMapper,
    OrderItemModifierMapper,
    TicketImpressionMapper,
  ],
})
export class RelationalOrderPersistenceModule {}