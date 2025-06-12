import { PizzaHalf } from './enums/pizza-half.enum';
import { IngredientAction } from './enums/ingredient-action.enum';

export class SelectedPizzaIngredient {
  id: string;
  half: PizzaHalf;
  pizzaIngredientId: string;
  orderItemId: string;
  action: IngredientAction;
  createdAt: Date;
  updatedAt: Date;
}
