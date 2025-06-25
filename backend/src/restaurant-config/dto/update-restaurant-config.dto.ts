import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBusinessHoursDto } from './create-business-hours.dto';

export class UpdateRestaurantConfigDto {
  // Información básica
  @ApiPropertyOptional({
    type: String,
    example: 'La Leña',
    description: 'Nombre del restaurante',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  restaurantName?: string;

  @ApiPropertyOptional({
    type: String,
    example: '+52 555 123 4567',
    description: 'Teléfono principal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneMain?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '+52 555 987 6543',
    description: 'Teléfono secundario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneSecondary?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Av. Principal 123, Col. Centro',
    description: 'Dirección completa',
  })
  @IsOptional()
  @IsString()
  address?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'Ciudad de México',
    description: 'Ciudad',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'CDMX',
    description: 'Estado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '06000',
    description: 'Código postal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: 'México',
    description: 'País',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string | null;

  // Configuración de operación
  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Indica si se están aceptando pedidos',
  })
  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 20,
    description: 'Tiempo estimado de recolección en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedPickupTime?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 40,
    description: 'Tiempo estimado de entrega en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDeliveryTime?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 25,
    description: 'Tiempo estimado para servir en mesa en minutos',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDineInTime?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    description: 'Minutos después de abrir antes de aceptar pedidos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  openingGracePeriod?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    description: 'Minutos antes de cerrar para dejar de aceptar pedidos',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  closingGracePeriod?: number;

  @ApiPropertyOptional({
    type: String,
    example: 'America/Mexico_City',
    description: 'Zona horaria del restaurante',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  timeZone?: string;

  // Configuración de delivery
  @ApiPropertyOptional({
    type: 'object',
    description: 'Polígono de cobertura de delivery',
    example: [
      { lat: 19.4326, lng: -99.1332 },
      { lat: 19.435, lng: -99.135 },
      { lat: 19.43, lng: -99.138 },
    ],
    additionalProperties: true,
  })
  @IsOptional()
  deliveryCoverageArea?: any | null;

  // Horarios de operación
  @ApiPropertyOptional({
    type: () => [CreateBusinessHoursDto],
    description: 'Horarios de operación por día',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBusinessHoursDto)
  businessHours?: CreateBusinessHoursDto[];
}
