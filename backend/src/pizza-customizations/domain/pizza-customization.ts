import { CustomizationType } from './enums/customization-type.enum';

export class PizzaCustomization {
  id: string;
  name: string;
  type: CustomizationType;
  ingredients?: string | null;
  toppingValue: number;
  isActive: boolean;
  sortOrder: number;
  productIds?: string[]; // Array de IDs de productos relacionados
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}