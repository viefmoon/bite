import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantConfigEntity } from '../../../../restaurant-config/infrastructure/persistence/relational/entities/restaurant-config.entity';
import { BusinessHoursEntity } from '../../../../restaurant-config/infrastructure/persistence/relational/entities/business-hours.entity';
import { RestaurantConfigSeedService } from './restaurant-config-seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantConfigEntity, BusinessHoursEntity]),
  ],
  providers: [RestaurantConfigSeedService],
  exports: [RestaurantConfigSeedService],
})
export class RestaurantConfigSeedModule {}
