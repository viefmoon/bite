import { Module, forwardRef } from '@nestjs/common';
import { RestaurantConfigService } from './restaurant-config.service';
import { RestaurantConfigController } from './restaurant-config.controller';
import { RelationalRestaurantConfigPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [
    RelationalRestaurantConfigPersistenceModule,
    forwardRef(() => ShiftsModule),
  ],
  controllers: [RestaurantConfigController],
  providers: [RestaurantConfigService],
  exports: [RestaurantConfigService],
})
export class RestaurantConfigModule {}
