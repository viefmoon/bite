import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class UpdateAddressDto {
  @ApiPropertyOptional({
    type: String,
    example: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    description:
      'ID de la dirección a actualizar (omitir para crear una nueva dirección dentro de una actualización de cliente)',
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Casa',
    description: 'Nombre o identificador de la dirección (ej: Casa, Oficina, Casa de mamá)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Calle Falsa',
    description: 'Nombre de la calle',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({
    type: String,
    example: '123',
    description: 'Número exterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  number?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A',
    description: 'Número interior o departamento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  interiorNumber?: string | null; // Permitir null para borrar

  @ApiPropertyOptional({
    type: String,
    example: 'Colonia Centro',
    description: 'Colonia o barrio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  neighborhood?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Ciudad Ejemplo',
    description: 'Ciudad',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Estado Ejemplo',
    description: 'Estado o provincia',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    type: String,
    example: '12345',
    description: 'Código postal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  zipCode?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'México',
    description: 'País',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Entre Calle A y Calle B, portón verde',
    description: 'Instrucciones adicionales para la entrega',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInstructions?: string | null; // Permitir null para borrar

  @ApiPropertyOptional({
    type: Number,
    example: 19.4326,
    description: 'Latitud de la ubicación',
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @IsLatitude()
  latitude?: number | null;

  @ApiPropertyOptional({
    type: Number,
    example: -99.1332,
    description: 'Longitud de la ubicación',
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @IsLongitude()
  longitude?: number | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Indica si es la dirección predeterminada del cliente',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
