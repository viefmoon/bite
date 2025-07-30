import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Portal, Text, Searchbar, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { FlashList } from '@shopify/flash-list';
import { useProductSelectionTree } from '../hooks/useProductSelectionTree';
import { CategoryRow } from './CategoryRow';
import { SubcategoryRow } from './SubcategoryRow';
import { ProductRow } from './ProductRow';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

interface Product {
  id: string;
  name: string;
  photo?: any;
  price?: string | number | null | undefined;
  isAssociated: boolean;
  currentPreparationScreenId: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  photo?: any;
  products: Product[];
}

interface Category {
  id: string;
  name: string;
  photo?: any;
  subcategories: Subcategory[];
}

interface MenuData {
  screenId: string;
  screenName: string;
  menu: Category[];
  screenAssignments?: Record<string, string>;
}

interface ProductSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (productIds: string[]) => void;
  screenId: string;
  menuData?: MenuData;
  loading?: boolean;
}

export const ProductSelectionModal: React.FC<ProductSelectionModalProps> = ({
  visible,
  onDismiss,
  onSave,
  screenId,
  menuData,
  loading = false,
}) => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Separar loading de menú y loading de guardado
  const isLoadingMenu = loading && !menuData;
  const isSaving = loading && !!menuData;

  const {
    selectedProducts,
    toggleCategory,
    toggleSubcategory,
    toggleProduct,
    toggleAllInCategory,
    toggleAllInSubcategory,
    isCategoryPartiallySelected,
    isCategoryFullySelected,
    isSubcategoryPartiallySelected,
    isSubcategoryFullySelected,
    isProductSelected,
    isCategoryExpanded,
    isSubcategoryExpanded,
    getConflictingProducts,
  } = useProductSelectionTree(menuData, screenId);

  // Filtrar menú basado en búsqueda
  const filteredMenu = useMemo(() => {
    if (!menuData || !searchQuery) return menuData?.menu || [];

    const query = searchQuery.toLowerCase();
    return menuData.menu
      .map((category) => ({
        ...category,
        subcategories: category.subcategories
          .map((subcategory) => ({
            ...subcategory,
            products: subcategory.products.filter((product) =>
              product.name.toLowerCase().includes(query),
            ),
          }))
          .filter((subcategory) => subcategory.products.length > 0),
      }))
      .filter((category) => category.subcategories.length > 0);
  }, [menuData, searchQuery]);

  // Crear estructura aplanada para FlashList
  type FlatItem =
    | { type: 'category'; data: Category; id: string }
    | { type: 'subcategory'; data: Subcategory; id: string; categoryId: string }
    | {
        type: 'product';
        data: Product;
        id: string;
        categoryId: string;
        subcategoryId: string;
      };

  const flattenedData = useMemo(() => {
    const items: FlatItem[] = [];

    filteredMenu.forEach((category) => {
      // Agregar categoría
      items.push({
        type: 'category',
        data: category,
        id: `category-${category.id}`,
      });

      // Si la categoría está expandida, agregar subcategorías y productos
      if (isCategoryExpanded(category.id)) {
        category.subcategories.forEach((subcategory) => {
          items.push({
            type: 'subcategory',
            data: subcategory,
            id: `subcategory-${subcategory.id}`,
            categoryId: category.id,
          });

          // Si la subcategoría está expandida, agregar productos
          if (isSubcategoryExpanded(subcategory.id)) {
            subcategory.products.forEach((product) => {
              items.push({
                type: 'product',
                data: product,
                id: `product-${product.id}`,
                categoryId: category.id,
                subcategoryId: subcategory.id,
              });
            });
          }
        });
      }
    });

    return items;
  }, [filteredMenu, isCategoryExpanded, isSubcategoryExpanded]);

  const handleSave = () => {
    // Siempre guardar directamente, las reasignaciones se manejan automáticamente
    onSave(selectedProducts);
  };

  const styles = useMemo(() => getStyles(theme), [theme]);

  // Obtener productos en conflicto para mostrar en el header
  const conflicts = getConflictingProducts;

  const headerActions = useMemo(
    () => (
      <View style={styles.headerActions}>
        {selectedProducts.length > 0 && (
          <Chip
            mode="flat"
            compact
            style={styles.selectedChip}
            icon="check-circle"
          >
            {selectedProducts.length} seleccionados
          </Chip>
        )}
      </View>
    ),
    [selectedProducts.length, styles],
  );

  return (
    <Portal>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title="Seleccionar Productos"
        headerRight={headerActions}
        dismissable={!isSaving}
        showCloseButton={!isSaving}
        maxHeightPercent={85}
        actions={[
          {
            label: 'Cancelar',
            mode: 'outlined' as const,
            onPress: onDismiss,
            disabled: isSaving,
          },
          {
            label: isSaving ? 'Guardando...' : 'Guardar',
            mode: 'contained' as const,
            onPress: handleSave,
            disabled: isSaving || selectedProducts.length === 0,
            loading: isSaving,
            colorPreset: 'primary' as const,
          },
        ]}
      >
        <View style={[styles.content, isSaving && styles.contentDisabled]}>
          <Searchbar
            placeholder="Buscar productos..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            mode="bar"
            icon="magnify"
            clearIcon="close"
            editable={!isSaving}
          />

          {isLoadingMenu ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando productos...</Text>
            </View>
          ) : (
            <View
              style={[
                styles.flashListContainer,
                isSaving && styles.listDisabled,
              ]}
            >
              <FlashList
                data={flattenedData}
                estimatedItemSize={60}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  switch (item.type) {
                    case 'category':
                      return (
                        <CategoryRow
                          category={item.data}
                          isExpanded={isCategoryExpanded(item.data.id)}
                          isFullySelected={isCategoryFullySelected(item.data)}
                          isPartiallySelected={isCategoryPartiallySelected(
                            item.data,
                          )}
                          onToggleExpansion={toggleCategory}
                          onToggleSelection={toggleAllInCategory}
                        />
                      );
                    case 'subcategory':
                      return (
                        <SubcategoryRow
                          subcategory={item.data}
                          isExpanded={isSubcategoryExpanded(item.data.id)}
                          isFullySelected={isSubcategoryFullySelected(
                            item.data,
                          )}
                          isPartiallySelected={isSubcategoryPartiallySelected(
                            item.data,
                          )}
                          onToggleExpansion={toggleSubcategory}
                          onToggleSelection={toggleAllInSubcategory}
                        />
                      );
                    case 'product':
                      return (
                        <ProductRow
                          product={item.data}
                          isSelected={isProductSelected(item.data.id)}
                          screenId={screenId}
                          onToggleSelection={toggleProduct}
                        />
                      );
                    default:
                      return null;
                  }
                }}
              />
            </View>
          )}
        </View>

        {/* Mostrar alerta de reasignación dentro del modal principal */}
        {conflicts.length > 0 && (
          <View style={styles.conflictAlert}>
            <View style={styles.conflictAlertHeader}>
              <MaterialCommunityIcons
                name="alert"
                size={20}
                color={theme.colors.error}
              />
              <Text style={styles.conflictAlertTitle}>
                {conflicts.length === 1
                  ? '1 producto será reasignado'
                  : `${conflicts.length} productos serán reasignados`}
              </Text>
            </View>
            <Text style={styles.conflictAlertText}>
              Los productos seleccionados que ya están en otras pantallas serán
              movidos automáticamente a esta pantalla.
            </Text>
          </View>
        )}

        {/* Overlay de carga al guardar */}
        {isSaving && (
          <View style={styles.savingOverlay}>
            <View style={styles.savingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.savingText}>Guardando cambios...</Text>
            </View>
          </View>
        )}
      </ResponsiveModal>
    </Portal>
  );
};

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    contentDisabled: {
      opacity: 0.6,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedChip: {
      backgroundColor: theme.colors.primaryContainer,
    },
    searchBar: {
      marginBottom: theme.spacing.m,
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    flashListContainer: {
      flex: 1,
      minHeight: 300,
    },
    listDisabled: {
      opacity: 0.6,
      pointerEvents: 'none',
    },
    loadingContainer: {
      flex: 1,
      minHeight: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    // Estilos para la alerta de conflictos
    conflictAlert: {
      backgroundColor: theme.colors.errorContainer,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    conflictAlertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    conflictAlertTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onErrorContainer,
      marginLeft: theme.spacing.s,
    },
    conflictAlertText: {
      fontSize: 13,
      color: theme.colors.onErrorContainer,
      lineHeight: 18,
    },
    savingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    savingContainer: {
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.xl,
      borderRadius: theme.roundness * 2,
      alignItems: 'center',
      elevation: 5,
    },
    savingText: {
      marginTop: theme.spacing.m,
      fontSize: 16,
      color: theme.colors.onSurface,
    },
  });
