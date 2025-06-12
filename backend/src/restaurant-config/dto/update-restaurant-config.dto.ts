import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

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
}
