import { Module } from '@nestjs/common';
import { RestaurantConfigService } from './restaurant-config.service';
import { RestaurantConfigController } from './restaurant-config.controller';
import { RelationalRestaurantConfigPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [RelationalRestaurantConfigPersistenceModule],
  controllers: [RestaurantConfigController],
  providers: [RestaurantConfigService],
  exports: [RestaurantConfigService],
})
export class RestaurantConfigModule {}
