import { NAVIGATION_PATHS } from '@/app/constants/navigationPaths';

export type MenuStackParamList = {
  [NAVIGATION_PATHS.CATEGORIES]: undefined;
  [NAVIGATION_PATHS.SUBCATEGORIES]: {
    categoryId: string;
    categoryName: string;
  };
  [NAVIGATION_PATHS.PRODUCTS]: {
    subcategoryId: string;
    subCategoryName: string;
  };
};
