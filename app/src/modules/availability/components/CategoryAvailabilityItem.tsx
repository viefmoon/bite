import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Switch, Divider, IconButton } from 'react-native-paper';
import { CategoryAvailability } from '../schema/availability.schema';
import { useOptimisticAvailability } from '../hooks/useOptimisticAvailability';
import { useAppTheme } from '@/app/styles/theme';
import { AvailabilityListItem } from './AvailabilityListItem';

interface CategoryAvailabilityItemProps {
  category: CategoryAvailability;
}

export const CategoryAvailabilityItem: React.FC<
  CategoryAvailabilityItemProps
> = ({ category }) => {
  const theme = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const updateAvailability = useOptimisticAvailability();

  const handleCategoryToggle = (value: boolean) => {
    updateAvailability.mutate({
      type: 'category',
      id: category.id,
      isActive: value,
      cascade: true,
    });
  };

  const handleSubcategoryToggle = (subcategoryId: string, value: boolean) => {
    updateAvailability.mutate({
      type: 'subcategory',
      id: subcategoryId,
      isActive: value,
      cascade: true,
    });
  };

  const handleProductToggle = (productId: string, value: boolean) => {
    updateAvailability.mutate({
      type: 'product',
      id: productId,
      isActive: value,
    });
  };

  const totalProducts = category.subcategories.reduce(
    (acc, sub) => acc + sub.products.length,
    0,
  );
  const activeProducts = category.subcategories.reduce(
    (acc, sub) => acc + sub.products.filter((p) => p.isActive).length,
    0,
  );

  return (
    <AvailabilityListItem
      title={category.name}
      subtitle={`${activeProducts}/${totalProducts} productos activos`}
      icon="folder-outline"
      isActive={category.isActive}
      onToggle={handleCategoryToggle}
      isExpanded={expanded}
      onToggleExpand={() => setExpanded(!expanded)}
    >
      {category.subcategories.map((subcategory, index) => (
        <View key={subcategory.id}>
          {index > 0 && <Divider style={styles.divider} />}
          <View
            style={[
              styles.subcategoryHeader,
              subcategory.isActive
                ? styles.activeSubcategory
                : styles.inactiveSubcategory,
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
                style={styles.subcategoryIcon}
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
              disabled={!category.isActive}
            />
          </View>
          <View style={styles.productsContainer}>
            {subcategory.products.map((product) => (
              <View
                key={product.id}
                style={[
                  styles.productItem,
                  product.isActive
                    ? styles.activeProduct
                    : styles.inactiveProduct,
                ]}
              >
                <Text
                  style={[
                    styles.productTitle,
                    !product.isActive && styles.strikethrough,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {product.name}
                </Text>
                <Switch
                  value={product.isActive}
                  onValueChange={(value) =>
                    handleProductToggle(product.id, value)
                  }
                  disabled={!category.isActive || !subcategory.isActive}
                />
              </View>
            ))}
          </View>
        </View>
      ))}
    </AvailabilityListItem>
  );
};

const styles = StyleSheet.create({
  divider: {
    marginVertical: 8,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
    paddingLeft: 16,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  productTitle: {
    fontSize: 13,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  activeSubcategory: {
    opacity: 1,
  },
  inactiveSubcategory: {
    opacity: 0.6,
  },
  subcategoryIcon: {
    margin: 0,
    marginRight: 8,
  },
  activeProduct: {
    opacity: 1,
  },
  inactiveProduct: {
    opacity: 0.5,
  },
});
