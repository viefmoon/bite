import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductVariantDto {
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
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Number,
    example: 0,
    default: 0,
    description: 'Orden de visualización de la variante',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({
    type: String,
    example: 'Hamburguesa Clásica',
    description: 'Nombre del producto',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    example:
      'Deliciosa hamburguesa con carne 100% res, lechuga, tomate y nuestra salsa especial',
    description: 'Descripción del producto',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    type: Number,
    example: 10.99,
    description: 'Precio del producto (puede ser nulo si tiene variantes)',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.hasVariants === false)
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty({
    type: Boolean,
    example: false,
    default: false,
    description: 'Indica si el producto tiene variantes',
  })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    default: true,
    description: 'Indica si el producto está activo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    default: false,
    description: 'Indica si el producto es una pizza',
  })
  @IsOptional()
  @IsBoolean()
  isPizza?: boolean;

  @ApiProperty({
    type: String,
    example: 'SUBCAT-1',
    description: 'ID de la subcategoría a la que pertenece el producto',
  })
  @IsString()
  @IsNotEmpty()
  subcategoryId: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la foto del producto',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  photoId?: string;

  @ApiProperty({
    type: Number,
    example: 15,
    description: 'Tiempo estimado de preparación en minutos',
  })
  @IsNumber()
  @Min(1)
  estimatedPrepTime: number;

  @ApiProperty({
    type: String,
    example: 'PREPSCR-1',
    description: 'ID de la pantalla de preparación',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  preparationScreenId?: string;

  @ApiProperty({
    type: [CreateProductVariantDto],
    description: 'Variantes del producto',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.hasVariants === true)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantDto)
  variants?: CreateProductVariantDto[];

  @ApiProperty({
    type: [String],
    example: [
      'MODGRP-1',
      'MODGRP-2',
    ],
    description: 'IDs de los grupos de modificadores a asociar con el producto',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifierGroupIds?: string[];

  @ApiProperty({
    type: Number,
    example: 0,
    default: 0,
    description: 'Orden de visualización del producto',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
