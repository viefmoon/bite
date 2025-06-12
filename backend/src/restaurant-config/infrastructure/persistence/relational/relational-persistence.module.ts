import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantConfigEntity } from './entities/restaurant-config.entity';
import { RestaurantConfigRepository } from '../restaurant-config.repository';
import { RestaurantConfigRelationalRepository } from './repositories/restaurant-config.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RestaurantConfigEntity])],
  providers: [
    {
      provide: RestaurantConfigRepository,
      useClass: RestaurantConfigRelationalRepository,
    },
  ],
  exports: [RestaurantConfigRepository],
})
export class RelationalRestaurantConfigPersistenceModule {}
