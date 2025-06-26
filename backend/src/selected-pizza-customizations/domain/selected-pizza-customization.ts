import { CustomizationAction } from './enums/customization-action.enum';
import { PizzaHalf } from './enums/pizza-half.enum';
import { PizzaCustomization } from '../../pizza-customizations/domain/pizza-customization';

export class SelectedPizzaCustomization {
  id: string;
  orderItemId: string;
  pizzaCustomizationId: string;
  pizzaCustomization?: PizzaCustomization;
  half: PizzaHalf;
  action: CustomizationAction;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
