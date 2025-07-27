import React, { useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Modal, Portal, Text, Button, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import { useProductSelectionTree } from '../hooks/useProductSelectionTree';
import { CategoryRow } from './CategoryRow';
import { SubcategoryRow } from './SubcategoryRow';
import { ProductRow } from './ProductRow';

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
  screenAssignments?: Record<string, string>; // Mapeo de productId a nombre de pantalla
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
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [conflictingProducts, setConflictingProducts] = useState<
    Array<{ id: string; name: string; currentScreen: string }>
  >([]);

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
    const conflicts = getConflictingProducts;

    if (conflicts.length > 0) {
      setConflictingProducts(conflicts);
      setShowConfirmDialog(true);
    } else {
      onSave(selectedProducts);
    }
  };

  const handleConfirmSave = () => {
    setShowConfirmDialog(false);
    onSave(selectedProducts);
  };

  const handleCancelSave = () => {
    setShowConfirmDialog(false);
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.header}>
          <Text variant="headlineSmall">Seleccionar Productos</Text>
        </View>

        <Searchbar
          placeholder="Buscar productos..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.flashListContainer}>
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
                        isFullySelected={isSubcategoryFullySelected(item.data)}
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

        <View style={styles.actions}>
          <Button mode="outlined" onPress={onDismiss}>
            Cancelar
          </Button>
          <Button mode="contained" onPress={handleSave} disabled={loading}>
            Guardar
          </Button>
        </View>
      </Modal>

      {/* Modal de confirmación personalizado */}
      <Modal
        visible={showConfirmDialog}
        onDismiss={handleCancelSave}
        contentContainerStyle={[
          styles.confirmModalContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Header */}
        <View
          style={[
            styles.confirmModalHeader,
            { borderBottomColor: theme.colors.surfaceVariant },
          ]}
        >
          <View
            style={[
              styles.confirmModalIcon,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <MaterialCommunityIcons
              name="alert"
              size={24}
              color={theme.colors.error}
            />
          </View>
          <Text variant="headlineSmall" style={styles.confirmModalTitle}>
            Reasignar Productos
          </Text>
        </View>

        {/* Subtitle */}
        <View style={styles.confirmModalSubtitleContainer}>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
            }}
          >
            {conflictingProducts.length === 1
              ? 'El siguiente producto será reasignado:'
              : `Los siguientes ${conflictingProducts.length} productos serán reasignados:`}
          </Text>
        </View>

        {/* Scrollable Product List */}
        <ScrollView
          style={styles.confirmModalScrollView}
          showsVerticalScrollIndicator={true}
        >
          {conflictingProducts.map((product, _index) => (
            <View
              key={product.id}
              style={[
                styles.confirmModalProductItem,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderLeftColor: theme.colors.error,
                },
              ]}
            >
              <Text
                variant="bodyLarge"
                style={[
                  styles.confirmModalProductName,
                  { color: theme.colors.onSurface },
                ]}
              >
                {product.name}
              </Text>
              <View
                style={[
                  styles.confirmModalProductContent,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <View style={styles.confirmModalProductSection}>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.confirmModalProductSectionText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Desde
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.confirmModalProductSectionLabel,
                      { color: theme.colors.error },
                    ]}
                  >
                    {product.currentScreen}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.confirmModalDivider}
                />

                <View style={styles.confirmModalProductSection}>
                  <Text
                    variant="labelSmall"
                    style={[
                      styles.confirmModalProductSectionText,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Hacia
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.confirmModalProductSectionLabel,
                      { color: theme.colors.primary },
                    ]}
                  >
                    {menuData?.screenName || 'Esta pantalla'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Info Box */}
        <View
          style={[
            styles.confirmModalInfoContainer,
            { backgroundColor: theme.colors.secondaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={theme.colors.onSecondaryContainer}
            style={styles.confirmModalInfoIcon}
          />
          <Text
            variant="bodySmall"
            style={[
              styles.confirmModalInfoText,
              { color: theme.colors.onSecondaryContainer },
            ]}
          >
            Los productos serán removidos automáticamente de sus pantallas
            actuales al confirmar.
          </Text>
        </View>

        {/* Actions */}
        <View
          style={[
            styles.confirmModalActions,
            { borderTopColor: theme.colors.surfaceVariant },
          ]}
        >
          <Button
            onPress={handleCancelSave}
            mode="outlined"
            style={[
              styles.confirmModalActionButton,
              { borderColor: theme.colors.outline },
            ]}
            contentStyle={styles.confirmModalActionButtonContent}
          >
            Cancelar
          </Button>
          <Button
            onPress={handleConfirmSave}
            mode="contained"
            buttonColor={theme.colors.error}
            icon="check-circle"
            style={styles.confirmModalActionButton}
            contentStyle={styles.confirmModalActionButtonContent}
          >
            Reasignar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  header: {
    marginBottom: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  flashListContainer: {
    height: 400,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  // Estilos para el modal de confirmación
  confirmModalContainer: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '75%',
    elevation: 8,
  },
  confirmModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  confirmModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  confirmModalTitle: {
    flex: 1,
  },
  confirmModalSubtitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  confirmModalScrollView: {
    maxHeight: 250,
    marginTop: 16,
    marginHorizontal: 20,
  },
  confirmModalProductItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  confirmModalProductName: {
    fontWeight: '600',
    marginBottom: 8,
  },
  confirmModalProductContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  confirmModalProductSection: {
    flex: 1,
    alignItems: 'center',
  },
  confirmModalProductSectionText: {
    marginBottom: 2,
  },
  confirmModalProductSectionLabel: {
    fontWeight: '500',
  },
  confirmModalDivider: {
    marginHorizontal: 8,
  },
  confirmModalInfoContainer: {
    margin: 20,
    marginTop: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmModalInfoIcon: {
    marginRight: 12,
  },
  confirmModalInfoText: {
    flex: 1,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    gap: 16,
    borderTopWidth: 1,
    marginTop: 16,
  },
  confirmModalActionButton: {
    flex: 1,
    maxWidth: 150,
  },
  confirmModalActionButtonContent: {
    paddingVertical: 4,
  },
});
