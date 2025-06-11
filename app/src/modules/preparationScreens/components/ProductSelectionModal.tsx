import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Checkbox,
  Button,
  Searchbar,
  Divider,
  IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

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
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(),
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<string>
  >(new Set());

  // Inicializar productos seleccionados
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

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleSubcategory = (subcategoryId: string) => {
    const newExpanded = new Set(expandedSubcategories);
    if (newExpanded.has(subcategoryId)) {
      newExpanded.delete(subcategoryId);
    } else {
      newExpanded.add(subcategoryId);
    }
    setExpandedSubcategories(newExpanded);
  };

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

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

  const isCategoryPartiallySelected = (category: Category) => {
    const categoryProducts = category.subcategories.flatMap((sub) =>
      sub.products.map((p) => p.id),
    );
    const selectedCount = categoryProducts.filter((id) =>
      selectedProducts.has(id),
    ).length;
    return selectedCount > 0 && selectedCount < categoryProducts.length;
  };

  const isCategoryFullySelected = (category: Category) => {
    const categoryProducts = category.subcategories.flatMap((sub) =>
      sub.products.map((p) => p.id),
    );
    return (
      categoryProducts.length > 0 &&
      categoryProducts.every((id) => selectedProducts.has(id))
    );
  };

  const isSubcategoryPartiallySelected = (subcategory: Subcategory) => {
    const selectedCount = subcategory.products.filter((p) =>
      selectedProducts.has(p.id),
    ).length;
    return selectedCount > 0 && selectedCount < subcategory.products.length;
  };

  const isSubcategoryFullySelected = (subcategory: Subcategory) => {
    return (
      subcategory.products.length > 0 &&
      subcategory.products.every((p) => selectedProducts.has(p.id))
    );
  };

  const handleSave = () => {
    onSave(Array.from(selectedProducts));
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
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {filteredMenu.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                >
                  <View style={styles.categoryTitleContainer}>
                    <IconButton
                      icon={
                        expandedCategories.has(category.id)
                          ? 'chevron-down'
                          : 'chevron-right'
                      }
                      size={20}
                    />
                    <Text variant="titleMedium" style={styles.categoryTitle}>
                      {category.name}
                    </Text>
                  </View>
                  <Checkbox.Android
                    status={
                      isCategoryFullySelected(category)
                        ? 'checked'
                        : isCategoryPartiallySelected(category)
                          ? 'indeterminate'
                          : 'unchecked'
                    }
                    onPress={() => toggleAllInCategory(category)}
                  />
                </TouchableOpacity>

                {expandedCategories.has(category.id) && (
                  <View style={styles.subcategoriesContainer}>
                    {category.subcategories.map((subcategory) => (
                      <View
                        key={subcategory.id}
                        style={styles.subcategoryContainer}
                      >
                        <TouchableOpacity
                          style={styles.subcategoryHeader}
                          onPress={() => toggleSubcategory(subcategory.id)}
                        >
                          <View style={styles.subcategoryTitleContainer}>
                            <IconButton
                              icon={
                                expandedSubcategories.has(subcategory.id)
                                  ? 'chevron-down'
                                  : 'chevron-right'
                              }
                              size={16}
                            />
                            <Text
                              variant="titleSmall"
                              style={styles.subcategoryTitle}
                            >
                              {subcategory.name}
                            </Text>
                          </View>
                          <Checkbox.Android
                            status={
                              isSubcategoryFullySelected(subcategory)
                                ? 'checked'
                                : isSubcategoryPartiallySelected(subcategory)
                                  ? 'indeterminate'
                                  : 'unchecked'
                            }
                            onPress={() => toggleAllInSubcategory(subcategory)}
                          />
                        </TouchableOpacity>

                        {expandedSubcategories.has(subcategory.id) && (
                          <View style={styles.productsContainer}>
                            {subcategory.products.map((product) => (
                              <TouchableOpacity
                                key={product.id}
                                style={styles.productItem}
                                onPress={() => toggleProduct(product.id)}
                              >
                                <View style={styles.productInfo}>
                                  <Text variant="bodyMedium">
                                    {product.name}
                                  </Text>
                                  {product.currentPreparationScreenId &&
                                    product.currentPreparationScreenId !==
                                      screenId && (
                                      <View style={styles.warningContainer}>
                                        <MaterialCommunityIcons
                                          name="alert"
                                          size={12}
                                          color={theme.colors.error}
                                        />
                                        <Text
                                          variant="bodySmall"
                                          style={[
                                            styles.warningText,
                                            { color: theme.colors.error },
                                          ]}
                                        >
                                          Asignado a otra pantalla
                                        </Text>
                                      </View>
                                    )}
                                </View>
                                <Checkbox.Android
                                  status={
                                    selectedProducts.has(product.id)
                                      ? 'checked'
                                      : 'unchecked'
                                  }
                                  onPress={() => toggleProduct(product.id)}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                <Divider style={styles.divider} />
              </View>
            ))}
          </ScrollView>
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
  scrollView: {
    maxHeight: 400,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryTitle: {
    fontWeight: 'bold',
  },
  subcategoriesContainer: {
    paddingLeft: 20,
  },
  subcategoryContainer: {
    marginBottom: 4,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subcategoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryTitle: {
    fontWeight: '600',
  },
  productsContainer: {
    paddingLeft: 20,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 16,
  },
  productInfo: {
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  warningText: {
    marginLeft: 4,
    fontSize: 11,
  },
  divider: {
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});
