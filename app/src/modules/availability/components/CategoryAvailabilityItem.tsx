import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Switch, Divider } from 'react-native-paper';
import { CategoryAvailability } from '../types/availability.types';
import { useOptimisticAvailability } from '../hooks/useOptimisticAvailability';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface CategoryAvailabilityItemProps {
  category: CategoryAvailability;
  onRefresh?: () => void;
}

export const CategoryAvailabilityItem: React.FC<
  CategoryAvailabilityItemProps
> = ({ category, onRefresh: _onRefresh }) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
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

const createStyles = (theme: AppTheme, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      marginHorizontal: responsive.spacing(theme.spacing.m),
      borderRadius: 16,
      overflow: 'hidden',
    },
    categoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: responsive.spacing(theme.spacing.m),
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    categoryIcon: {
      width: responsive.isTablet ? 32 : 40,
      height: responsive.isTablet ? 32 : 40,
      borderRadius: responsive.isTablet ? 16 : 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: responsive.spacing(theme.spacing.m),
    },
    categoryInfo: {
      flex: 1,
    },
    categoryTitle: {
      fontSize: responsive.fontSize(16),
      fontWeight: '600',
      marginBottom: 2,
    },
    categorySubtitle: {
      fontSize: responsive.fontSize(12),
      opacity: 0.8,
    },
    categoryRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categorySwitch: {
      marginHorizontal: responsive.spacing(theme.spacing.s),
    },
    expandedContent: {
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.m),
    },
    divider: {
      marginVertical: responsive.spacing(theme.spacing.m),
      marginHorizontal: responsive.spacing(theme.spacing.s),
    },
    subcategoryHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.spacing(theme.spacing.m),
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      borderRadius: 8,
      marginBottom: responsive.spacing(theme.spacing.s),
    },
    subcategoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    subcategoryTitle: {
      fontSize: responsive.fontSize(14),
      fontWeight: '500',
    },
    productsContainer: {
      marginLeft: responsive.spacing(theme.spacing.l),
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.spacing(theme.spacing.s),
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      borderRadius: 6,
      marginBottom: responsive.spacing(theme.spacing.xs),
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
      marginRight: responsive.spacing(theme.spacing.m),
    },
    productTitle: {
      fontSize: responsive.fontSize(13),
      flex: 1,
    },
  });
