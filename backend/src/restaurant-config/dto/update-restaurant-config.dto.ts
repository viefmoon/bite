import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  Min,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateRestaurantConfigDto {
  @ApiPropertyOptional({
    type: Boolean,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  acceptingOrders?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 30,
    description: 'Estimated pickup time in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedPickupTime?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 45,
    description: 'Estimated delivery time in minutes',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  estimatedDeliveryTime?: number;

  @ApiPropertyOptional({
    type: String,
    example: '09:00:00',
    description: 'Opening time in HH:mm:ss format',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Opening time must be in HH:mm:ss format',
  })
  openingTime?: string | null;

  @ApiPropertyOptional({
    type: String,
    example: '22:00:00',
    description: 'Closing time in HH:mm:ss format',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, {
    message: 'Closing time must be in HH:mm:ss format',
  })
  closingTime?: string | null;
}
