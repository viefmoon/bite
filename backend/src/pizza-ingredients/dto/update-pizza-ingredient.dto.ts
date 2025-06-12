import { PartialType } from '@nestjs/swagger';
import { CreatePizzaIngredientDto } from './create-pizza-ingredient.dto';

export class UpdatePizzaIngredientDto extends PartialType(
  CreatePizzaIngredientDto,
) {}
