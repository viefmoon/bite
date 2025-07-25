import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsBoolean,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';

export class CreateAdjustmentDto {
  @ApiProperty({
    description: 'Order ID (required for order-level adjustments)',
    required: false,
  })
  @ValidateIf((o) => !o.orderItemId)
  @IsString()
  @IsNotEmpty()
  orderId?: string;

  @ApiProperty({
    description: 'Order Item ID (required for item-level adjustments)',
    required: false,
  })
  @ValidateIf((o) => !o.orderId)
  @IsString()
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
