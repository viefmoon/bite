export interface PizzaConfiguration {
  id: string;
  productId: string;
  includedToppings: number;
  extraToppingCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePizzaConfigurationInput {
  productId: string;
  includedToppings: number;
  extraToppingCost: number;
}

export interface UpdatePizzaConfigurationInput {
  includedToppings?: number;
  extraToppingCost?: number;
}