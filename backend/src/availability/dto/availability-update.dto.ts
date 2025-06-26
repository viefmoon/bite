import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum AvailabilityType {
  CATEGORY = 'category',
  SUBCATEGORY = 'subcategory',
  PRODUCT = 'product',
  MODIFIER_GROUP = 'modifierGroup',
  MODIFIER = 'modifier',
  PIZZA_CUSTOMIZATION = 'pizzaCustomization',
}

export class AvailabilityUpdateDto {
  @ApiProperty({
    description: 'Type of entity to update',
    enum: AvailabilityType,
  })
  @IsEnum(AvailabilityType)
  type: AvailabilityType;

  @ApiProperty({
    description: 'ID of the entity to update',
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'New availability status',
  })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    description: 'Whether to cascade the update to child entities',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  cascade?: boolean;
}

export class BulkAvailabilityUpdateDto {
  @ApiProperty({
    description: 'Array of availability updates',
    type: [AvailabilityUpdateDto],
  })
  updates: AvailabilityUpdateDto[];
}
