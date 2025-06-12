import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RestaurantConfigEntity } from '../../../../restaurant-config/infrastructure/persistence/relational/entities/restaurant-config.entity';

@Injectable()
export class RestaurantConfigSeedService {
  constructor(
    @InjectRepository(RestaurantConfigEntity)
    private repository: Repository<RestaurantConfigEntity>,
  ) {}

  async run() {
    const countConfig = await this.repository.count();

    if (!countConfig) {
      const defaultConfig = this.repository.create({
        acceptingOrders: true,
        estimatedPickupTime: 30,
        estimatedDeliveryTime: 45,
      });

      await this.repository.save(defaultConfig);
    }
  }
}
