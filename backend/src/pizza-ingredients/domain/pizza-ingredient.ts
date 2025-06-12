export class PizzaIngredient {
  id: string;
  name: string;
  ingredientValue: number;
  productId?: string | null;
  ingredients?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
