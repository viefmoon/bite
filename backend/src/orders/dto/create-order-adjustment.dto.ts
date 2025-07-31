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
  IsOptional,
} from 'class-validator';

export class CreateOrderAdjustmentDto {
  @ApiProperty({
    description: 'Name of the adjustment',
    maxLength: 100,
    example: 'Cargo adicional',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Whether the adjustment is a percentage',
    default: false,
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isPercentage: boolean;

  @ApiProperty({
    description: 'Value of the adjustment (percentage if isPercentage is true)',
    minimum: 0,
    maximum: 100,
    required: false,
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.isPercentage)
  @Max(100)
  value?: number;

  @ApiProperty({
    description: 'Fixed amount of the adjustment (negative for discounts)',
    example: 55,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @ValidateIf((o) => !o.isPercentage)
  @IsNotEmpty()
  amount?: number;
}