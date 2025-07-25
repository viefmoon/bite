export enum CustomizationType {
  FLAVOR = 'FLAVOR',
  INGREDIENT = 'INGREDIENT',
}

export enum PizzaHalf {
  FULL = 'FULL',
  HALF_1 = 'HALF_1',
  HALF_2 = 'HALF_2',
}

export enum CustomizationAction {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export interface PizzaCustomization {
  id: string;
  name: string;
  type: CustomizationType;
  ingredients?: string | null;
  toppingValue: number;
  isActive: boolean;
  sortOrder: number;
  productIds?: string[];
  products?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface SelectedPizzaCustomization {
  id: string;
  orderItemId: string;
  pizzaCustomizationId: string;
  pizzaCustomization?: PizzaCustomization;
  half: PizzaHalf;
  action: CustomizationAction;
  createdAt: string;
  updatedAt: string;
}
