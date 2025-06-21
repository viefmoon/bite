import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID, Min } from 'class-validator';

export class CreatePizzaConfigurationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: 4,
    description: 'Number of toppings included in base price',
    default: 4,
  })
  @IsNumber()
  @Min(0)
  includedToppings: number;

  @ApiProperty({
    example: 20,
    description: 'Cost per extra topping',
    default: 20,
  })
  @IsNumber()
  @IsPositive()
  extraToppingCost: number;
}