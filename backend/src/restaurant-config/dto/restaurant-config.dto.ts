import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BusinessHoursDto } from './business-hours.dto';

export class RestaurantConfigDto {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  // Información básica
  @ApiProperty({
    type: String,
    example: 'La Leña',
    description: 'Nombre del restaurante',
  })
  restaurantName: string;

  @ApiPropertyOptional({
    type: String,
    example: '+52 555 123 4567',
    description: 'Teléfono principal',
  })
  phoneMain: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '+52 555 987 6543',
    description: 'Teléfono secundario',
  })
  phoneSecondary: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Av. Principal 123, Col. Centro',
    description: 'Dirección completa',
  })
  address: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Ciudad de México',
    description: 'Ciudad',
  })
  city: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'CDMX',
    description: 'Estado',
  })
  state: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '06000',
    description: 'Código postal',
  })
  postalCode: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'México',
    description: 'País',
  })
  country: string | null;

  // Configuración de operación
  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si se están aceptando pedidos',
  })
  acceptingOrders: boolean;

  @ApiProperty({
    type: Number,
    example: 20,
    description: 'Tiempo estimado de recolección en minutos',
  })
  estimatedPickupTime: number;

  @ApiProperty({
    type: Number,
    example: 40,
    description: 'Tiempo estimado de entrega en minutos',
  })
  estimatedDeliveryTime: number;

  @ApiProperty({
    type: Number,
    example: 30,
    description: 'Minutos después de abrir antes de aceptar pedidos',
  })
  openingGracePeriod: number;

  @ApiProperty({
    type: Number,
    example: 30,
    description: 'Minutos antes de cerrar para dejar de aceptar pedidos',
  })
  closingGracePeriod: number;

  @ApiProperty({
    type: String,
    example: 'America/Mexico_City',
    description: 'Zona horaria del restaurante',
  })
  timeZone: string;

  // Configuración de delivery
  @ApiPropertyOptional({
    type: 'object',
    description: 'Polígono de cobertura de delivery',
    example: [
      { lat: 19.4326, lng: -99.1332 },
      { lat: 19.4350, lng: -99.1350 },
      { lat: 19.4300, lng: -99.1380 },
    ],
  })
  deliveryCoverageArea: any | null;

  // Relaciones
  @ApiProperty({
    type: () => [BusinessHoursDto],
    description: 'Horarios de operación por día',
  })
  @Type(() => BusinessHoursDto)
  businessHours: BusinessHoursDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
