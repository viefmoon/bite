export interface CategoryAvailability {
  id: string;
  name: string;
  isActive: boolean;
  subcategories: SubcategoryAvailability[];
}

export interface SubcategoryAvailability {
  id: string;
  name: string;
  isActive: boolean;
  categoryId: string;
  products: ProductAvailability[];
}

export interface ProductAvailability {
  id: string;
  name: string;
  isActive: boolean;
  subcategoryId: string;
  modifierGroups?: ModifierGroupAvailability[];
}

export interface ModifierGroupAvailability {
  id: string;
  name: string;
  isActive: boolean;
  modifiers: ModifierAvailability[];
}

export interface ModifierAvailability {
  id: string;
  name: string;
  isActive: boolean;
  modifierGroupId: string;
}

export interface PizzaCustomizationAvailability {
  id: string;
  name: string;
  type: 'FLAVOR' | 'INGREDIENT';
  isActive: boolean;
  sortOrder: number;
}

export interface PizzaCustomizationGroupAvailability {
  type: string;
  items: PizzaCustomizationAvailability[];
}

export interface AvailabilityUpdatePayload {
  type: 'category' | 'subcategory' | 'product' | 'modifierGroup' | 'modifier' | 'pizzaCustomization';
  id: string;
  isActive: boolean;
  cascade?: boolean;
}

export interface AvailabilityFilter {
  search?: string;
  showOnlyUnavailable?: boolean;
  categoryId?: string;
  subcategoryId?: string;
}
