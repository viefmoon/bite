import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { PizzaHalf } from '../domain/enums/pizza-half.enum';
import { IngredientAction } from '../domain/enums/ingredient-action.enum';

export class CreateSelectedPizzaIngredientDto {
  @ApiProperty({
    enum: PizzaHalf,
    description: 'Which half of the pizza',
    example: PizzaHalf.FULL,
    default: PizzaHalf.FULL,
  })
  @IsEnum(PizzaHalf)
  half: PizzaHalf;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the pizza ingredient',
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @IsNotEmpty()
  @IsUUID()
  pizzaIngredientId: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'ID of the order item',
    example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae',
  })
  @IsNotEmpty()
  @IsUUID()
  orderItemId: string;

  @ApiProperty({
    enum: IngredientAction,
    description: 'Action to perform with the ingredient',
    example: IngredientAction.ADD,
    default: IngredientAction.ADD,
  })
  @IsEnum(IngredientAction)
  action: IngredientAction;
}
