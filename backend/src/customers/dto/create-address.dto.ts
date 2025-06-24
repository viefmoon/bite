import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsUUID,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: 'uuid-cliente',
    description:
      'ID del cliente al que pertenece la dirección (requerido si no se usa la ruta anidada)',
  })
  @IsUUID()
  @IsOptional() // Hacerlo opcional aquí, pero la lógica del servicio lo requerirá si no viene de la ruta
  customerId?: string;

  @ApiProperty({
    type: String,
    example: 'Casa',
    description: 'Nombre o identificador de la dirección (ej: Casa, Oficina, Casa de mamá)',
  })
  @IsNotEmpty({ message: 'El nombre de la dirección es obligatorio' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    type: String,
    example: 'Calle Falsa',
    description: 'Nombre de la calle',
  })
  @IsNotEmpty({ message: 'La calle es obligatoria' })
  @IsString()
  @MaxLength(200)
  street: string;

  @ApiPropertyOptional({
    type: String,
    example: '123',
    description: 'Número exterior',
  })
  @IsNotEmpty({ message: 'El número exterior es obligatorio' })
  @IsString()
  @MaxLength(50)
  number: string;

  @ApiPropertyOptional({
    type: String,
    example: 'A',
    description: 'Número interior o departamento',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  interiorNumber?: string;

  @ApiProperty({
    type: String,
    example: 'Colonia Centro',
    description: 'Colonia o barrio',
  })
  @IsNotEmpty({ message: 'La colonia es obligatoria' })
  @IsString()
  @MaxLength(150)
  neighborhood: string;

  @ApiProperty({
    type: String,
    example: 'Ciudad Ejemplo',
    description: 'Ciudad',
  })
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  @IsString()
  @MaxLength(100)
  city: string;

  @ApiProperty({
    type: String,
    example: 'Estado Ejemplo',
    description: 'Estado o provincia',
  })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsString()
  @MaxLength(100)
  state: string;

  @ApiProperty({
    type: String,
    example: '12345',
    description: 'Código postal',
  })
  @IsNotEmpty({ message: 'El código postal es obligatorio' })
  @IsString()
  @MaxLength(10)
  zipCode: string;

  @ApiProperty({
    type: String,
    example: 'México',
    description: 'País',
  })
  @IsNotEmpty({ message: 'El país es obligatorio' })
  @IsString()
  @MaxLength(100)
  country: string;

  @ApiPropertyOptional({
    type: String,
    example: 'Entre Calle A y Calle B, portón verde',
    description: 'Instrucciones adicionales para la entrega',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInstructions?: string;

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
  latitude?: number;

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
  longitude?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    default: false,
    description: 'Indica si es la dirección predeterminada del cliente',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
