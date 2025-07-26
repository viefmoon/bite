import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateSelectedPizzaCustomizationDto } from '../../selected-pizza-customizations/dto/create-selected-pizza-customization.dto';
import { ProductModifierDto } from './product-modifier.dto';

export class OrderItemInputDto {
  @ApiProperty({
    type: String,
    example: 'ORDERITEM-1',
    description: 'ID del order item (opcional, para actualizaciones)',
    required: false,
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    type: String,
    example: 'PROD-1',
    description: 'ID del producto',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    type: String,
    example: 'PRODVAR-1',
    description: 'ID de la variante del producto (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  productVariantId?: string;

  @ApiProperty({
    type: Number,
    example: 10.99,
    description: 'Precio base del producto',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    type: Number,
    example: 12.99,
    description: 'Precio final del producto (incluyendo modificadores)',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  finalPrice: number;

  @ApiProperty({
    type: String,
    example: 'Sin cebolla, extra queso',
    description: 'Notas de preparación (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  preparationNotes?: string;

  @ApiProperty({
    type: [ProductModifierDto],
    description: 'Lista de modificadores del producto (opcional)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductModifierDto)
  productModifiers?: ProductModifierDto[];

  @ApiProperty({
    type: [CreateSelectedPizzaCustomizationDto],
    description: 'Personalizaciones de pizza (opcional)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSelectedPizzaCustomizationDto)
  selectedPizzaCustomizations?: CreateSelectedPizzaCustomizationDto[];
}
