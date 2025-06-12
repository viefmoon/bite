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

  @ApiProperty({
    type: String,
    example: '09:00:00',
    description: 'Opening time in HH:mm:ss format',
    nullable: true,
  })
  openingTime: string | null;

  @ApiProperty({
    type: String,
    example: '22:00:00',
    description: 'Closing time in HH:mm:ss format',
    nullable: true,
  })
  closingTime: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
