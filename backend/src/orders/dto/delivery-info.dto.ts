import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class DeliveryInfoDto {
  @ApiProperty({
    type: String,
    example: 'Av. Revolución 123, Col. Centro, entre calles X y Y',
    description:
      'Dirección completa en una línea (útil para pedidos telefónicos)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fullAddress?: string;

  @ApiProperty({
    type: String,
    example: 'Av. Revolución',
    description: 'Calle de entrega',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  street?: string;

  @ApiProperty({
    type: String,
    example: '123',
    description: 'Número exterior',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  number?: string;

  @ApiProperty({
    type: String,
    example: 'A',
    description: 'Número interior',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  interiorNumber?: string;

  @ApiProperty({
    type: String,
    example: 'Centro',
    description: 'Colonia o barrio',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  neighborhood?: string;

  @ApiProperty({
    type: String,
    example: 'Guadalajara',
    description: 'Ciudad',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiProperty({
    type: String,
    example: 'Jalisco',
    description: 'Estado o provincia',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiProperty({
    type: String,
    example: '44100',
    description: 'Código postal',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiProperty({
    type: String,
    example: 'México',
    description: 'País',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiProperty({
    type: String,
    example: 'Juan Pérez',
    description: 'Nombre de quien recibe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  recipientName?: string;

  @ApiProperty({
    type: String,
    example: '+523331234567',
    description: 'Teléfono de contacto para la entrega',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'El número de teléfono debe tener al menos 10 dígitos',
  })
  @MaxLength(15, {
    message: 'El número de teléfono no puede tener más de 15 dígitos',
  })
  @Matches(/^\+?[0-9]+$/, {
    message:
      'El número de teléfono solo debe contener dígitos y puede empezar con +',
  })
  recipientPhone?: string;

  @ApiProperty({
    type: String,
    example: 'Casa blanca con portón negro, tocar el timbre 2 veces',
    description: 'Instrucciones adicionales para la entrega',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryInstructions?: string;

  @ApiProperty({
    type: Number,
    example: 20.6597,
    description: 'Latitud de la dirección',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    type: Number,
    example: -103.3496,
    description: 'Longitud de la dirección',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
