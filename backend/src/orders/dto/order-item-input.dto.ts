import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateOrderItemModifierDto } from './create-order-item-modifier.dto';
import { CreateSelectedPizzaCustomizationDto } from '../../selected-pizza-customizations/dto/create-selected-pizza-customization.dto';

/**
 * DTO for order items when creating a new order.
 * Does not include orderId since the order doesn't exist yet.
 */
export class OrderItemInputDto {
  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID del producto',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'ID de la variante del producto (opcional)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
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
    type: [CreateOrderItemModifierDto],
    description: 'Modificadores del producto (opcional)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];

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
