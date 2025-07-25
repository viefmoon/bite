import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KitchenController } from './controllers/kitchen.controller';
import { KitchenService } from './services/kitchen.service';
import { KitchenOrderQueryBuilderService } from './services/kitchen-order-query-builder.service';
import { KitchenOrderMapperService } from './services/kitchen-order-mapper.service';
import { ScreenStatusProcessorService } from './services/screen-status-processor.service';
import { OrderItemOperationsService } from './services/order-item-operations.service';
import { OrderEntity } from '../orders/infrastructure/persistence/relational/entities/order.entity';
import { OrderItemEntity } from '../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { UserEntity } from '../users/infrastructure/persistence/relational/entities/user.entity';
import { PreparationScreenEntity } from '../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import { RelationalOrderPersistenceModule } from '../orders/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      UserEntity,
      PreparationScreenEntity,
    ]),
    forwardRef(() => RelationalOrderPersistenceModule),
  ],
  controllers: [KitchenController],
  providers: [
    KitchenService,
    KitchenOrderQueryBuilderService,
    KitchenOrderMapperService,
    ScreenStatusProcessorService,
    OrderItemOperationsService,
  ],
  exports: [KitchenService],
})
export class KitchenModule {}
