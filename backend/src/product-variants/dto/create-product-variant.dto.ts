import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del producto al que pertenece esta variante',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    type: String,
    example: 'Grande',
    description: 'Nombre de la variante',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: Number,
    example: 12.99,
    description: 'Precio de la variante',
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: true,
    description: 'Indica si la variante está activa',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
