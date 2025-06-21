export class PizzaConfiguration {
  id: string;
  productId: string;
  includedToppings: number;
  extraToppingCost: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}