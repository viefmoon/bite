export enum CustomizationType {
  FLAVOR = 'FLAVOR',
  INGREDIENT = 'INGREDIENT',
}

export enum PizzaHalf {
  FULL = 'FULL',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
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
