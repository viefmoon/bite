import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { RestaurantConfigRepository } from './infrastructure/persistence/restaurant-config.repository';
import { RestaurantConfig } from './domain/restaurant-config';
import { UpdateRestaurantConfigDto } from './dto/update-restaurant-config.dto';
import { ShiftsService } from '../shifts/shifts.service';

@Injectable()
export class RestaurantConfigService {
  constructor(
    private readonly restaurantConfigRepository: RestaurantConfigRepository,
    @Inject(forwardRef(() => ShiftsService))
    private readonly shiftsService: ShiftsService,
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
      defaultConfig.estimatedDineInTime = 25;
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

    // Verificar si se está intentando cambiar 'acceptingOrders'
    if (
      updateRestaurantConfigDto.acceptingOrders !== undefined &&
      updateRestaurantConfigDto.acceptingOrders !== config.acceptingOrders
    ) {
      // Comprobar si hay un turno abierto
      const isShiftOpen = await this.shiftsService.isShiftOpen();

      // Si no hay un turno abierto, no se permite cambiar el estado de los pedidos
      if (!isShiftOpen) {
        throw new BadRequestException(
          'No se puede cambiar el estado de "Aceptar Pedidos" porque no hay ningún turno abierto.',
        );
      }
    }

    // Convertir DTO a dominio
    const updated = await this.restaurantConfigRepository.update(
      config.id,
      updateRestaurantConfigDto as Partial<RestaurantConfig>,
    );

    if (!updated) {
      throw new NotFoundException('Configuration not found');
    }

    return updated;
  }
}
