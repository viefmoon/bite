import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { TicketImpressionEntity } from './entities/ticket-impression.entity';
import { OrderHistoryEntity } from './entities/order-history.entity';
import { DeliveryInfoEntity } from './entities/delivery-info.entity';
import { OrderPreparationScreenStatusEntity } from './entities/order-preparation-screen-status.entity';
import { OrdersRelationalRepository } from './repositories/order.repository';
import { OrderItemRelationalRepository } from './repositories/order-item.repository';
import { TicketImpressionRelationalRepository } from './repositories/ticket-impression-relational.repository';
import { OrderHistoryRelationalRepository } from './repositories/order-history.repository';
import { OrderPreparationScreenStatusRelationalRepository } from './repositories/order-preparation-screen-status.repository';
import { OrderMapper } from './mappers/order.mapper';
import { OrderItemMapper } from './mappers/order-item.mapper';
import { TicketImpressionMapper } from './mappers/ticket-impression.mapper';
import { DeliveryInfoMapper } from './mappers/delivery-info.mapper';
import { OrderPreparationScreenStatusMapper } from './mappers/order-preparation-screen-status.mapper';
import {
  ORDER_REPOSITORY,
  ORDER_ITEM_REPOSITORY,
  TICKET_IMPRESSION_REPOSITORY,
  ORDER_HISTORY_REPOSITORY,
  ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY,
} from '../../../../common/tokens';
import { RelationalUserPersistenceModule } from '../../../../users/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalTablePersistenceModule } from '../../../../tables/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalPaymentPersistenceModule } from '../../../../payments/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductPersistenceModule } from '../../../../products/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductVariantPersistenceModule } from '../../../../product-variants/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalProductModifierPersistenceModule } from '../../../../product-modifiers/infrastructure/persistence/relational/relational-persistence.module';
import { AdjustmentsRelationalPersistenceModule } from '../../../../adjustments/infrastructure/persistence/relational/relational-persistence.module';
import { ShiftsModule } from '../../../../shifts/shifts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      TicketImpressionEntity,
      OrderHistoryEntity,
      DeliveryInfoEntity,
      OrderPreparationScreenStatusEntity,
    ]),
    RelationalUserPersistenceModule,
    RelationalTablePersistenceModule,
    forwardRef(() => RelationalPaymentPersistenceModule), // Usar forwardRef aquí
    RelationalProductPersistenceModule,
    RelationalProductVariantPersistenceModule,
    RelationalProductModifierPersistenceModule,
    forwardRef(() => AdjustmentsRelationalPersistenceModule), // Usar forwardRef para evitar dependencias circulares
    forwardRef(() => ShiftsModule), // Para acceder a ShiftsService
  ],
  providers: [
    {
      provide: ORDER_REPOSITORY,
      useClass: OrdersRelationalRepository,
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
    {
      provide: ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY,
      useClass: OrderPreparationScreenStatusRelationalRepository,
    },
    OrderMapper,
    OrderItemMapper,
    TicketImpressionMapper,
    DeliveryInfoMapper,
    OrderPreparationScreenStatusMapper,
  ],
  exports: [
    ORDER_REPOSITORY,
    ORDER_ITEM_REPOSITORY,
    TICKET_IMPRESSION_REPOSITORY,
    ORDER_HISTORY_REPOSITORY,
    ORDER_PREPARATION_SCREEN_STATUS_REPOSITORY,
    OrderMapper,
    OrderItemMapper,
    TicketImpressionMapper,
    DeliveryInfoMapper,
    OrderPreparationScreenStatusMapper,
  ],
})
export class RelationalOrderPersistenceModule {}
