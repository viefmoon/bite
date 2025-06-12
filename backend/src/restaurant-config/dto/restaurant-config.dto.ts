import { ApiProperty } from '@nestjs/swagger';

export class RestaurantConfigDto {
  @ApiProperty({
    type: String,
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  id: string;

  @ApiProperty({
    type: Boolean,
    example: true,
  })
  acceptingOrders: boolean;

  @ApiProperty({
    type: Number,
    example: 30,
    description: 'Estimated pickup time in minutes',
  })
  estimatedPickupTime: number;

  @ApiProperty({
    type: Number,
    example: 45,
    description: 'Estimated delivery time in minutes',
  })
  estimatedDeliveryTime: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
