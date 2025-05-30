import { FileType } from '../../files/domain/file';
import { Subcategory } from '../../subcategories/domain/Subcategory';

export class Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  photoId: string | null;
  photo: FileType | null;
  subcategories: Subcategory[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
