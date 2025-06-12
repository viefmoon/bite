import { Injectable, NotFoundException } from '@nestjs/common';
import { RestaurantConfigRepository } from './infrastructure/persistence/restaurant-config.repository';
import { RestaurantConfig } from './domain/restaurant-config';
import { UpdateRestaurantConfigDto } from './dto/update-restaurant-config.dto';

@Injectable()
export class RestaurantConfigService {
  constructor(
    private readonly restaurantConfigRepository: RestaurantConfigRepository,
  ) {}

  async findOrCreate(): Promise<RestaurantConfig> {
    let config = await this.restaurantConfigRepository.findFirst();

    if (!config) {
      // Create default configuration
      const defaultConfig = new RestaurantConfig();
      defaultConfig.acceptingOrders = true;
      defaultConfig.estimatedPickupTime = 30;
      defaultConfig.estimatedDeliveryTime = 45;

      config = await this.restaurantConfigRepository.create(defaultConfig);
    }

    return config;
  }

  async getConfig(): Promise<RestaurantConfig> {
    return this.findOrCreate();
  }

  async updateConfig(
    updateRestaurantConfigDto: UpdateRestaurantConfigDto,
  ): Promise<RestaurantConfig> {
    const config = await this.findOrCreate();

    const updated = await this.restaurantConfigRepository.update(
      config.id,
      updateRestaurantConfigDto,
    );

    if (!updated) {
      throw new NotFoundException('Configuration not found');
    }

    return updated;
  }
}
