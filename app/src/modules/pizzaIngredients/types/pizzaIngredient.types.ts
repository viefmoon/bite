export interface PizzaIngredient {
  id: string;
  name: string;
  ingredientValue: number;
  productId?: string | null;
  ingredients?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CreatePizzaIngredientDto {
  name: string;
  ingredientValue: number;
  ingredients?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePizzaIngredientDto {
  name?: string;
  ingredientValue?: number;
  ingredients?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface FindAllPizzaIngredientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
