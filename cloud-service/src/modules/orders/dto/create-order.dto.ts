import { IsString, IsEnum, IsArray, IsOptional, IsNumber, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  productVariantId?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsArray()
  selectedPizzaIngredients?: any[];

  @IsOptional()
  @IsArray()
  selectedModifiers?: any[];
}

export class CreateOrderDto {
  @IsEnum(['delivery', 'pickup'])
  orderType: 'delivery' | 'pickup';

  @IsNumber()
  totalCost: number;

  @IsString()
  customerId: string;

  @IsString()
  customerPhone: string;

  @IsOptional()
  @IsNumber()
  estimatedTime?: number;

  @IsOptional()
  @IsDateString()
  scheduledDeliveryTime?: Date;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  deliveryAdditionalDetails?: string;

  @IsOptional()
  @IsNumber()
  deliveryLatitude?: number;

  @IsOptional()
  @IsNumber()
  deliveryLongitude?: number;

  @IsOptional()
  @IsString()
  pickupName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}