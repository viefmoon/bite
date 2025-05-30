import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PreparationStatus } from '../domain/order-item';

export class UpdateOrderItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  productVariantId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  finalPrice?: number;

  @IsOptional()
  @IsEnum(PreparationStatus)
  preparationStatus?: PreparationStatus;

  @IsOptional()
  @IsString()
  preparationNotes?: string;
}
