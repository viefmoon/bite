import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { AdjustmentType } from '../domain/enums/adjustment-type.enum';

export class CreateAdjustmentDto {
  @ApiProperty({
    enum: AdjustmentType,
    description: 'Type of adjustment',
  })
  @IsEnum(AdjustmentType)
  @IsNotEmpty()
  type: AdjustmentType;

  @ApiProperty({
    description: 'Order ID (required for order-level adjustments)',
    required: false,
  })
  @ValidateIf((o) => !o.orderItemId)
  @IsUUID()
  @IsNotEmpty()
  orderId?: string;

  @ApiProperty({
    description: 'Order Item ID (required for item-level adjustments)',
    required: false,
  })
  @ValidateIf((o) => !o.orderId)
  @IsUUID()
  @IsNotEmpty()
  orderItemId?: string;

  @ApiProperty({
    description: 'Name of the adjustment',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Optional description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Whether the adjustment is a percentage',
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isPercentage: boolean;

  @ApiProperty({
    description: 'Value of the adjustment (percentage if isPercentage is true)',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.isPercentage)
  @Max(100)
  value: number;

  @ApiProperty({
    description: 'Fixed amount of the adjustment (negative for discounts)',
  })
  @IsNumber()
  @ValidateIf((o) => !o.isPercentage)
  @IsNotEmpty()
  amount?: number;
}
