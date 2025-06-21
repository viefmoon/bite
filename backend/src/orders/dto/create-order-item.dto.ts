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
import { CreateOrderItemModifierDto } from './create-order-item-modifier.dto';
import { CreateSelectedPizzaCustomizationDto } from '../../selected-pizza-customizations/dto/create-selected-pizza-customization.dto';

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSelectedPizzaCustomizationDto)
  selectedPizzaCustomizations?: CreateSelectedPizzaCustomizationDto[];
}
