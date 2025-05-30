import { ProductModifier } from '../../product-modifiers/domain/product-modifier';
import { Product } from '../../products/domain/product';

export class ModifierGroup {
  id: string;

  name: string;

  description: string | null;

  minSelections: number;

  maxSelections: number;

  isRequired: boolean;

  allowMultipleSelections: boolean;

  isActive: boolean;

  productModifiers: ProductModifier[];

  products: Product[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
