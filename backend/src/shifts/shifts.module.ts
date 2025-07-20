import { Module, forwardRef } from '@nestjs/common';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';
import { RelationalShiftPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RestaurantConfigModule } from '../restaurant-config/restaurant-config.module';
import { RelationalOrderPersistenceModule } from '../orders/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalPaymentPersistenceModule } from '../payments/infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalShiftPersistenceModule,
    forwardRef(() => RestaurantConfigModule),
    forwardRef(() => RelationalOrderPersistenceModule),
    forwardRef(() => RelationalPaymentPersistenceModule),
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
