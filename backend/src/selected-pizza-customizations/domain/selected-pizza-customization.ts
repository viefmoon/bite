import { CustomizationAction } from './enums/customization-action.enum';
import { PizzaHalf } from './enums/pizza-half.enum';

export class SelectedPizzaCustomization {
  id: string;
  orderItemId: string;
  pizzaCustomizationId: string;
  half: PizzaHalf;
  action: CustomizationAction;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
