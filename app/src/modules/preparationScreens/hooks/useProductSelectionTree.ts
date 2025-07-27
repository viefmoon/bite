import { useState, useEffect, useMemo, useCallback } from 'react';

interface Product {
  id: string;
  name: string;
  photo: any;
  price: string | number | null | undefined;
  isAssociated: boolean;
  currentPreparationScreenId: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  photo: any;
  products: Product[];
}

interface Category {
  id: string;
  name: string;
  photo: any;
  subcategories: Subcategory[];
}

interface MenuData {
  screenId: string;
  screenName: string;
  menu: Category[];
  screenAssignments?: Record<string, string>;
}

export const useProductSelectionTree = (
  menuData?: MenuData,
  screenId?: string,
) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<string>
  >(new Set());

  // Inicializar productos seleccionados cuando cambia menuData
  useEffect(() => {
    if (menuData) {
      const associatedProducts = new Set<string>();
      menuData.menu.forEach((category) => {
        category.subcategories.forEach((subcategory) => {
          subcategory.products.forEach((product) => {
            if (product.isAssociated) {
              associatedProducts.add(product.id);
            }
          });
        });
      });
      setSelectedProducts(associatedProducts);
    }
  }, [menuData]);

  // Función para obtener el nombre de pantalla para un producto
  const getScreenNameForProduct = useCallback(
    (productId: string): string => {
      if (
        menuData?.screenAssignments &&
        menuData.screenAssignments[productId]
      ) {
        return menuData.screenAssignments[productId];
      }
      return 'otra pantalla de preparación';
    },
    [menuData?.screenAssignments],
  );

  // Función para alternar expansión de categoría
  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Función para alternar expansión de subcategoría
  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  // Función para alternar selección de producto
  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  // Función para alternar todos los productos de una categoría
  const toggleAllInCategory = (category: Category) => {
    const newSelected = new Set(selectedProducts);
    const categoryProducts = category.subcategories.flatMap((sub) =>
      sub.products.map((p) => p.id),
    );

    const allSelected = categoryProducts.every((id) => newSelected.has(id));

    if (allSelected) {
      categoryProducts.forEach((id) => newSelected.delete(id));
    } else {
      categoryProducts.forEach((id) => newSelected.add(id));
    }

    setSelectedProducts(newSelected);
  };

  // Función para alternar todos los productos de una subcategoría
  const toggleAllInSubcategory = (subcategory: Subcategory) => {
    const newSelected = new Set(selectedProducts);
    const subcategoryProducts = subcategory.products.map((p) => p.id);

    const allSelected = subcategoryProducts.every((id) => newSelected.has(id));

    if (allSelected) {
      subcategoryProducts.forEach((id) => newSelected.delete(id));
    } else {
      subcategoryProducts.forEach((id) => newSelected.add(id));
    }

    setSelectedProducts(newSelected);
  };

  // Función para verificar si una categoría está parcialmente seleccionada
  const isCategoryPartiallySelected = (category: Category) => {
    const categoryProducts = category.subcategories.flatMap((sub) =>
      sub.products.map((p) => p.id),
    );
    const selectedCount = categoryProducts.filter((id) =>
      selectedProducts.has(id),
    ).length;
    return selectedCount > 0 && selectedCount < categoryProducts.length;
  };

  // Función para verificar si una categoría está completamente seleccionada
  const isCategoryFullySelected = (category: Category) => {
    const categoryProducts = category.subcategories.flatMap((sub) =>
      sub.products.map((p) => p.id),
    );
    return (
      categoryProducts.length > 0 &&
      categoryProducts.every((id) => selectedProducts.has(id))
    );
  };

  // Función para verificar si una subcategoría está parcialmente seleccionada
  const isSubcategoryPartiallySelected = (subcategory: Subcategory) => {
    const selectedCount = subcategory.products.filter((p) =>
      selectedProducts.has(p.id),
    ).length;
    return selectedCount > 0 && selectedCount < subcategory.products.length;
  };

  // Función para verificar si una subcategoría está completamente seleccionada
  const isSubcategoryFullySelected = (subcategory: Subcategory) => {
    return (
      subcategory.products.length > 0 &&
      subcategory.products.every((p) => selectedProducts.has(p.id))
    );
  };

  // Función para verificar si un producto está seleccionado
  const isProductSelected = (productId: string) => {
    return selectedProducts.has(productId);
  };

  // Función para verificar si una categoría está expandida
  const isCategoryExpanded = (categoryId: string) => {
    return expandedCategories.has(categoryId);
  };

  // Función para verificar si una subcategoría está expandida
  const isSubcategoryExpanded = (subcategoryId: string) => {
    return expandedSubcategories.has(subcategoryId);
  };

  // Función para obtener productos en conflicto
  const getConflictingProducts = useMemo(() => {
    const conflicts: Array<{
      id: string;
      name: string;
      currentScreen: string;
    }> = [];

    if (menuData && screenId) {
      menuData.menu.forEach((category) => {
        category.subcategories.forEach((subcategory) => {
          subcategory.products.forEach((product) => {
            if (
              selectedProducts.has(product.id) &&
              product.currentPreparationScreenId &&
              product.currentPreparationScreenId !== screenId
            ) {
              const screenName = getScreenNameForProduct(product.id);
              conflicts.push({
                id: product.id,
                name: product.name,
                currentScreen: screenName,
              });
            }
          });
        });
      });
    }

    return conflicts;
  }, [selectedProducts, menuData, screenId, getScreenNameForProduct]);

  return {
    // Estados
    selectedProducts: Array.from(selectedProducts),
    expandedCategories,
    expandedSubcategories,

    // Funciones de toggle
    toggleCategory,
    toggleSubcategory,
    toggleProduct,
    toggleAllInCategory,
    toggleAllInSubcategory,

    // Funciones de verificación
    isCategoryPartiallySelected,
    isCategoryFullySelected,
    isSubcategoryPartiallySelected,
    isSubcategoryFullySelected,
    isProductSelected,
    isCategoryExpanded,
    isSubcategoryExpanded,

    // Utilidades
    getScreenNameForProduct,
    getConflictingProducts,
  };
};
