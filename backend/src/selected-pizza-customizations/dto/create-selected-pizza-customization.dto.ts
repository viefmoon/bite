import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CustomizationAction } from '../domain/enums/customization-action.enum';
import { PizzaHalf } from '../domain/enums/pizza-half.enum';

export class CreateSelectedPizzaCustomizationDto {
  @ApiProperty({ example: 'PEPPERONI' })
  @IsNotEmpty()
  @IsString()
  pizzaCustomizationId: string;

  @ApiProperty({
    enum: PizzaHalf,
    example: PizzaHalf.FULL,
    description: 'Which half of the pizza',
  })
  @IsEnum(PizzaHalf)
  half: PizzaHalf;

  @ApiProperty({
    enum: CustomizationAction,
    example: CustomizationAction.ADD,
    description: 'Add or remove customization',
  })
  @IsEnum(CustomizationAction)
  action: CustomizationAction;
}
