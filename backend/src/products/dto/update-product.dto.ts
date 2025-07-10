import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
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

export class UpdateProductVariantDto {
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
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description:
      'ID de la variante (solo para actualizar variantes existentes)',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

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

export class UpdateProductDto {
  @ApiProperty({
    type: String,
    example: 'Hamburguesa Clásica',
    description: 'Nombre del producto',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

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
  description?: string | null;

  @ApiProperty({
    type: Number,
    example: 10.99,
    description: 'Precio del producto (puede ser nulo si tiene variantes)',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => o.hasVariants === false)
  @IsNumber()
  @IsPositive()
  price?: number | null;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si el producto tiene variantes',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiProperty({
    type: Boolean,
    example: true,
    description: 'Indica si el producto está activo',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    type: Boolean,
    example: false,
    description: 'Indica si el producto es una pizza',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPizza?: boolean;

  @ApiProperty({
    type: String,
    example: 'SUBCAT-1',
    description: 'ID de la subcategoría a la que pertenece el producto',
    required: false,
  })
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la foto del producto',
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  photoId?: string | null;

  @ApiProperty({
    type: Number,
    example: 15,
    description: 'Tiempo estimado de preparación en minutos',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  estimatedPrepTime?: number;

  @ApiProperty({
    type: String,
    example: 'PREPSCR-1',
    description: 'ID de la pantalla de preparación',
    required: false,
  })
  @IsOptional()
  @IsString()
  preparationScreenId?: string;

  @ApiProperty({
    type: [UpdateProductVariantDto],
    description:
      'Lista completa de variantes deseadas para el producto. Las variantes existentes no incluidas aquí serán eliminadas. Incluir "id" para actualizar una existente, omitirlo para crear una nueva.',
    required: false,
  })
  @IsOptional()
  // Permitir el array incluso si hasVariants es false temporalmente, la lógica del servicio lo manejará.
  // @ValidateIf((o) => o.hasVariants === true)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductVariantDto)
  variants?: UpdateProductVariantDto[];

  @ApiProperty({
    type: [String],
    example: ['MODGRP-1', 'MODGRP-2'],
    description:
      'Lista completa de IDs de los grupos de modificadores a asociar. Las asociaciones existentes no incluidas aquí serán eliminadas.',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifierGroupIds?: string[];

  @ApiProperty({
    type: Number,
    example: 0,
    description: 'Orden de visualización del producto',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
