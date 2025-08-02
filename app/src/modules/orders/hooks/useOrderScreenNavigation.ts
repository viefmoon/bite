import { useMemo } from 'react';
import { Product, Category, SubCategory } from '../schema/orders.schema';

interface UseOrderScreenNavigationProps {
  menu: any;
  navigationLevel: string;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  selectedProduct: Product | null;
}

export const useOrderScreenNavigation = ({
  menu,
  navigationLevel,
  selectedCategoryId,
  selectedSubcategoryId,
  selectedProduct,
}: UseOrderScreenNavigationProps) => {
  // Estados derivados para la navegación
  const selectedCategory = useMemo(
    () =>
      menu && Array.isArray(menu)
        ? menu.find((cat: Category) => cat.id === selectedCategoryId)
        : null,
    [menu, selectedCategoryId],
  );

  const selectedSubCategory = useMemo(
    () =>
      selectedCategory && Array.isArray(selectedCategory.subcategories)
        ? selectedCategory.subcategories.find(
            (sub: SubCategory) => sub.id === selectedSubcategoryId,
          )
        : null,
    [selectedCategory, selectedSubcategoryId],
  );

  const itemsToDisplay = useMemo(() => {
    switch (navigationLevel) {
      case 'categories':
        return menu && Array.isArray(menu) ? menu : [];
      case 'subcategories':
        return selectedCategory?.subcategories || [];
      case 'products':
        return selectedSubCategory?.products || [];
      default:
        return [];
    }
  }, [navigationLevel, menu, selectedCategory, selectedSubCategory]);

  const navTitle = useMemo(() => {
    if (selectedProduct) {
      return selectedProduct.name;
    }
    switch (navigationLevel) {
      case 'categories':
        return 'Categorías';
      case 'subcategories':
        return selectedCategory?.name
          ? `Categoría: ${selectedCategory.name}`
          : 'Subcategorías';
      case 'products':
        return selectedSubCategory?.name
          ? `Subcategoría: ${selectedSubCategory.name}`
          : 'Productos';
      default:
        return 'Categorías';
    }
  }, [navigationLevel, selectedCategory, selectedSubCategory, selectedProduct]);

  return {
    selectedCategory,
    selectedSubCategory,
    itemsToDisplay,
    navTitle,
  };
};
