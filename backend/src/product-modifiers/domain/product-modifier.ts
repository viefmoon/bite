export class ProductModifier {
  id: string;

  modifierGroupId: string;

  name: string;

  description: string | null;

  price: number | null;

  sortOrder: number;

  isDefault: boolean;

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
