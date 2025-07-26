import { useState, useCallback } from 'react';
import { Product } from '../../schema/orders.schema';

export type NavigationLevel = 'categories' | 'subcategories' | 'products';

export const useOrderNavigation = () => {
  const [navigationLevel, setNavigationLevel] =
    useState<NavigationLevel>('categories');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<
    string | null
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(null);
    setNavigationLevel('subcategories');
  }, []);

  const handleSubCategorySelect = useCallback((subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setNavigationLevel('products');
  }, []);

  const handleGoBackInternal = useCallback(() => {
    if (navigationLevel === 'products') {
      setNavigationLevel('subcategories');
      setSelectedSubcategoryId(null);
    } else if (navigationLevel === 'subcategories') {
      setNavigationLevel('categories');
      setSelectedCategoryId(null);
    }
  }, [navigationLevel]);

  const resetNavigation = useCallback(() => {
    setNavigationLevel('categories');
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setSelectedProduct(null);
  }, []);

  return {
    navigationLevel,
    selectedCategoryId,
    selectedSubcategoryId,
    selectedProduct,
    setSelectedProduct,
    handleCategorySelect,
    handleSubCategorySelect,
    handleGoBackInternal,
    resetNavigation,
  };
};
