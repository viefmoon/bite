import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantConfigEntity } from './entities/restaurant-config.entity';
import { BusinessHoursEntity } from './entities/business-hours.entity';
import { RestaurantConfigRepository } from '../restaurant-config.repository';
import { RestaurantConfigRelationalRepository } from './repositories/restaurant-config.repository';
import { RestaurantConfigMapper } from './mappers/restaurant-config.mapper';
import { BusinessHoursMapper } from './mappers/business-hours.mapper';

@Module({
  imports: [
    TypeOrmModule.forFeature([RestaurantConfigEntity, BusinessHoursEntity]),
  ],
  providers: [
    {
      provide: RestaurantConfigRepository,
      useClass: RestaurantConfigRelationalRepository,
    },
    RestaurantConfigMapper,
    BusinessHoursMapper,
  ],
  exports: [RestaurantConfigRepository],
})
export class RelationalRestaurantConfigPersistenceModule {}
