import { Subcategory } from '../../subcategories/domain/subcategory';
import { FileType } from '../../files/domain/file';
import { ProductVariant } from '../../product-variants/domain/product-variant';
import { ModifierGroup } from '../../modifier-groups/domain/modifier-group';
import { PreparationScreen } from '../../preparation-screens/domain/preparation-screen';
export class Product {
  id: string;

  name: string;

  description: string | null;

  price: number | null;

  hasVariants: boolean;

  isActive: boolean;

  isAvailable: boolean;

  subcategoryId: string;

  preparationScreenId: string | null;

  photoId: string | null;

  estimatedPrepTime: number;

  photo: FileType | null;

  subcategory: Subcategory | null;

  variants: ProductVariant[];

  modifierGroups: ModifierGroup[];

  preparationScreen: PreparationScreen | null;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
