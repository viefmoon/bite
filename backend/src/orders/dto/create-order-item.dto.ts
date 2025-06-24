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
import { CreateSelectedPizzaCustomizationDto } from '../../selected-pizza-customizations/dto/create-selected-pizza-customization.dto';
import { ProductModifierDto } from './product-modifier.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  finalPrice: number;

  @IsOptional()
  @IsString()
  preparationNotes?: string;

  @ApiProperty({
    type: [ProductModifierDto],
    description: 'Lista de modificadores del producto',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductModifierDto)
  productModifiers?: ProductModifierDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSelectedPizzaCustomizationDto)
  selectedPizzaCustomizations?: CreateSelectedPizzaCustomizationDto[];
}
