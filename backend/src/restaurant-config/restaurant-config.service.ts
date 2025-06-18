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
      // Información básica
      defaultConfig.restaurantName = 'Restaurante Ejemplo';
      defaultConfig.phoneMain = null;
      defaultConfig.phoneSecondary = null;
      defaultConfig.address = null;
      defaultConfig.city = null;
      defaultConfig.state = null;
      defaultConfig.postalCode = null;
      defaultConfig.country = null;
      
      // Configuración de operación
      defaultConfig.acceptingOrders = true;
      defaultConfig.estimatedPickupTime = 20;
      defaultConfig.estimatedDeliveryTime = 40;
      defaultConfig.openingGracePeriod = 30;
      defaultConfig.closingGracePeriod = 30;
      defaultConfig.timeZone = 'America/Mexico_City';
      
      // Configuración de delivery
      defaultConfig.deliveryCoverageArea = null;
      
      // Relaciones
      defaultConfig.businessHours = [];

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
    
    // Convertir DTO a dominio, excluyendo businessHours que se maneja aparte
    const { businessHours, ...updateData } = updateRestaurantConfigDto;

    const updated = await this.restaurantConfigRepository.update(
      config.id,
      updateData as Partial<RestaurantConfig>,
    );

    if (!updated) {
      throw new NotFoundException('Configuration not found');
    }

    return updated;
  }
}
