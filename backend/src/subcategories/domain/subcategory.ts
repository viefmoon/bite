import { Category } from '../../categories/domain/category';
import { FileType } from '../../files/domain/file';
import { Product } from '../../products/domain/product';


export class Subcategory {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  isActive: boolean;


  photoId: string | null;

  category: Category | null;

  photo: FileType | null;

  products: Product[] | null;

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
