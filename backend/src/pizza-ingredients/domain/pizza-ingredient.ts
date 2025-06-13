export class PizzaIngredient {
  id: string;
  name: string;
  ingredientValue: number;
  ingredients?: string | null;
  isActive: boolean;
  sortOrder: number;
  productIds?: string[]; // Array de IDs de productos relacionados
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
