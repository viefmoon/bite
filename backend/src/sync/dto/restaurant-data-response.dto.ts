import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../categories/domain/category';
import { RestaurantConfig } from '../../restaurant-config/domain/restaurant-config';
import { BusinessHours } from '../../restaurant-config/domain/business-hours';

class MenuDataDto {
  @ApiProperty({
    type: [Category],
    description: 'Lista completa de categorías con productos',
  })
  categories: Category[];

  @ApiProperty({
    description: 'Fecha de última actualización del menú',
    example: '2024-01-15T10:30:00Z',
  })
  lastUpdated: Date;
}

class ConfigDataDto {
  @ApiProperty({
    type: RestaurantConfig,
    description: 'Configuración completa del restaurante',
  })
  restaurantConfig: RestaurantConfig;

  @ApiProperty({
    type: [BusinessHours],
    description: 'Horarios de operación del restaurante',
  })
  businessHours: BusinessHours[];

  @ApiProperty({
    description: 'Fecha de última actualización de la configuración',
    example: '2024-01-15T10:30:00Z',
  })
  lastUpdated: Date;
}

export class RestaurantDataResponseDto {
  @ApiProperty({
    type: MenuDataDto,
    description: 'Datos completos del menú',
  })
  menu: MenuDataDto;

  @ApiProperty({
    type: ConfigDataDto,
    description: 'Datos completos de configuración',
  })
  config: ConfigDataDto;

  @ApiProperty({
    description: 'Timestamp del momento de la respuesta',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: Date;
}
