import { FileType } from '../../files/domain/file';
import { Subcategory } from '../../subcategories/domain/subcategory';

export class Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  photoId: string | null;
  photo: FileType | null;
  subcategories: Subcategory[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
