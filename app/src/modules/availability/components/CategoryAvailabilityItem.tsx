import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Surface, Text, IconButton, Switch, Divider } from 'react-native-paper';
import { CategoryAvailability } from '../types/availability.types';
import { useUpdateAvailability } from '../hooks/useAvailabilityQueries';
import { useAppTheme } from '@/app/styles/theme';

interface CategoryAvailabilityItemProps {
  category: CategoryAvailability;
  onRefresh?: () => void;
}

export const CategoryAvailabilityItem: React.FC<
  CategoryAvailabilityItemProps
> = ({ category, onRefresh }) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const updateAvailability = useUpdateAvailability();

  const handleCategoryToggle = async (value: boolean) => {
    await updateAvailability.mutateAsync({
      type: 'category',
      id: category.id,
      isActive: value,
      cascade: true,
    });
    onRefresh?.();
  };

  const handleSubcategoryToggle = async (
    subcategoryId: string,
    value: boolean,
  ) => {
    await updateAvailability.mutateAsync({
      type: 'subcategory',
      id: subcategoryId,
      isActive: value,
      cascade: true,
    });
    onRefresh?.();
  };

  const handleProductToggle = async (productId: string, value: boolean) => {
    await updateAvailability.mutateAsync({
      type: 'product',
      id: productId,
      isActive: value,
    });
    onRefresh?.();
  };

  const unavailableCount = category.subcategories.reduce((acc, sub) => {
    return acc + sub.products.filter((p) => !p.isActive).length;
  }, 0);

  const totalProducts = category.subcategories.reduce(
    (acc, sub) => acc + sub.products.length,
    0,
  );
  const activeProducts = totalProducts - unavailableCount;

  return (
    <Surface
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      {/* Header de la categoría */}
      <TouchableOpacity
        style={[
          styles.categoryHeader,
          {
            backgroundColor: theme.colors.elevation.level2,
            opacity: category.isActive ? 1 : 0.7,
          },
        ]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryLeft}>
          <View
            style={[
              styles.categoryIcon,
              {
                backgroundColor: category.isActive
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            <IconButton
              icon="folder-outline"
              size={20}
              iconColor={
                category.isActive ? theme.colors.primary : theme.colors.outline
              }
              style={{ margin: 0 }}
            />
          </View>
          <View style={styles.categoryInfo}>
            <Text
              style={[styles.categoryTitle, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
            <Text
              style={[
                styles.categorySubtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {activeProducts}/{totalProducts} productos activos
            </Text>
          </View>
        </View>

        <View style={styles.categoryRight}>
          <Switch
            value={category.isActive}
            onValueChange={handleCategoryToggle}
            color={theme.colors.primary}
            style={styles.categorySwitch}
          />
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            iconColor={theme.colors.onSurfaceVariant}
            style={{ margin: 0 }}
          />
        </View>
      </TouchableOpacity>

      {/* Contenido expandible */}
      {expanded && (
        <View
          style={[
            styles.expandedContent,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          {category.subcategories.map((subcategory, index) => (
            <View key={subcategory.id}>
              {index > 0 && <Divider style={styles.divider} />}

              {/* Subcategoría */}
              <View
                style={[
                  styles.subcategoryHeader,
                  {
                    backgroundColor: theme.colors.elevation.level3,
                    opacity: subcategory.isActive ? 1 : 0.6,
                  },
                ]}
              >
                <View style={styles.subcategoryLeft}>
                  <IconButton
                    icon="folder-open-outline"
                    size={16}
                    iconColor={
                      subcategory.isActive
                        ? theme.colors.primary
                        : theme.colors.outline
                    }
                    style={{ margin: 0, marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.subcategoryTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {subcategory.name}
                  </Text>
                </View>
                <Switch
                  value={subcategory.isActive}
                  onValueChange={(value) =>
                    handleSubcategoryToggle(subcategory.id, value)
                  }
                  color={theme.colors.primary}
                  disabled={!category.isActive}
                />
              </View>

              {/* Productos */}
              <View style={styles.productsContainer}>
                {subcategory.products.map((product) => (
                  <View
                    key={product.id}
                    style={[
                      styles.productItem,
                      {
                        backgroundColor: theme.colors.surface,
                        opacity:
                          !category.isActive ||
                          !subcategory.isActive ||
                          !product.isActive
                            ? 0.5
                            : 1,
                      },
                    ]}
                  >
                    <View style={styles.productLeft}>
                      <View
                        style={[
                          styles.productDot,
                          {
                            backgroundColor: product.isActive
                              ? theme.colors.primary
                              : theme.colors.error,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.productTitle,
                          {
                            color: product.isActive
                              ? theme.colors.onSurface
                              : theme.colors.onSurfaceDisabled,
                            textDecorationLine: !product.isActive
                              ? 'line-through'
                              : 'none',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {product.name}
                      </Text>
                    </View>
                    <Switch
                      value={product.isActive}
                      onValueChange={(value) =>
                        handleProductToggle(product.id, value)
                      }
                      color={theme.colors.primary}
                      disabled={!category.isActive || !subcategory.isActive}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categorySubtitle: {
    fontSize: 12,
    opacity: 0.8,
  },
  categoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySwitch: {
    marginHorizontal: 8,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    marginVertical: 12,
    marginHorizontal: 8,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subcategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  productsContainer: {
    marginLeft: 24,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  productLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  productDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  productTitle: {
    fontSize: 13,
    flex: 1,
  },
});
