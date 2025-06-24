import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PreparationStatus } from '../domain/order-item';
import { SelectedModifierDto } from './selected-modifier.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderItemDto {
  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsUUID()
  productVariantId?: string;

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

  @ApiProperty({
    type: [SelectedModifierDto],
    description: 'Lista de modificadores seleccionados',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedModifierDto)
  selectedModifiers?: SelectedModifierDto[];
}
