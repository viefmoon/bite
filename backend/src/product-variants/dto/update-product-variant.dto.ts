import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class UpdateProductVariantDto {
  @ApiProperty({
    type: String,
    example: 'PROD-1',
    description: 'ID del producto al que pertenece esta variante',
    required: false,
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiProperty({
    type: String,
    example: 'Grande',
    description: 'Nombre de la variante',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    type: Number,
    example: 12.99,
    description: 'Precio de la variante',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si la variante está activa',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Orden de visualización de la variante',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
