import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Surface,
  Text,
  IconButton,
  Chip,
  Button,
  ActivityIndicator,
  Menu,
  Searchbar,
  Badge,
  Avatar,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useQuery } from '@tanstack/react-query';
import { productsService } from '@/modules/menu/services/productsService';
import EmptyState from '@/app/components/common/EmptyState';
import { Product } from '@/modules/menu/schema/products.schema';
import { getImageUrl } from '@/app/lib/imageUtils';
import { PizzaConfigurationModal } from './PizzaConfigurationModal';
import { AssociatePizzaToppingsModal } from './AssociatePizzaToppingsModal';

export function PizzaProductsTab() {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'configured' | 'not_configured'>(
    'all',
  );
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [ingredientsModalVisible, setIngredientsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['pizza-products', filter],
    queryFn: async () => {
      const pizzaProducts = await productsService.findAllPizzas();
      return pizzaProducts;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!data) return [];

    let filtered = data.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (filter === 'configured') {
      filtered = filtered.filter((product) => product.pizzaConfiguration);
    } else if (filter === 'not_configured') {
      filtered = filtered.filter((product) => !product.pizzaConfiguration);
    }

    return filtered;
  }, [data, searchQuery, filter]);

  const renderProductItem = ({ item }: { item: Product }) => {
    const isConfigured = !!item.pizzaConfiguration;
    const customizations = item.pizzaCustomizations || [];
    const flavorsCount = customizations.filter(
      (c: any) => c.type === 'FLAVOR',
    ).length;
    const ingredientsCount = customizations.filter(
      (c: any) => c.type === 'INGREDIENT',
    ).length;
    const imageUrl = item.photo?.path ? getImageUrl(item.photo.path) : null;
    const variantsCount = item.variants?.length || 0;

    return (
      <Surface style={styles.productCard} elevation={2}>
        <View style={styles.productHeader}>
          <View style={styles.productTitleRow}>
            {imageUrl ? (
              <Avatar.Image
                size={48}
                source={{ uri: imageUrl }}
                style={styles.productImage}
              />
            ) : (
              <Avatar.Icon
                size={48}
                icon="pizza"
                style={[
                  styles.productImage,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              />
            )}

            <View style={styles.productInfo}>
              <Text
                variant="titleMedium"
                style={styles.productName}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text variant="bodySmall" style={styles.variantText}>
                {variantsCount > 0
                  ? `${variantsCount} tamaños`
                  : 'Sin variantes'}
              </Text>
            </View>

            <View style={styles.productActions}>
              <IconButton
                icon="cog"
                mode="contained-tonal"
                size={28}
                onPress={() => {
                  setSelectedProduct(item);
                  setConfigModalVisible(true);
                }}
                style={styles.actionButton}
              />
              <IconButton
                icon="cheese"
                mode="contained-tonal"
                size={28}
                onPress={() => {
                  setSelectedProduct(item);
                  setIngredientsModalVisible(true);
                }}
                style={styles.actionButton}
              />
            </View>
          </View>
        </View>

        <View style={styles.productStatus}>
          <Chip
            mode="flat"
            compact
            icon={isConfigured ? 'check-circle' : 'alert-circle'}
            style={[
              styles.statusChip,
              {
                backgroundColor: isConfigured
                  ? theme.colors.primaryContainer
                  : theme.colors.errorContainer,
              },
            ]}
            textStyle={styles.chipText}
          >
            {isConfigured ? 'Configurada' : 'Sin configurar'}
          </Chip>

          <View style={styles.countsContainer}>
            <Text variant="bodySmall" style={styles.countText}>
              {flavorsCount} sabores
            </Text>
            <Text variant="bodySmall" style={styles.countDivider}>
              •
            </Text>
            <Text variant="bodySmall" style={styles.countText}>
              {ingredientsCount} ingredientes
            </Text>
          </View>
        </View>
      </Surface>
    );
  };

  const hasActiveFilter = filter !== 'all';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: theme.spacing.m,
      backgroundColor: theme.colors.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    searchbar: {
      flex: 1,
      backgroundColor: theme.colors.elevation.level2,
    },
    filterButtonContainer: {
      position: 'relative',
    },
    filterIconButton: {
      margin: 0,
      backgroundColor: theme.colors.elevation.level2,
    },
    filterBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: theme.colors.primary,
    },
    menuContent: {
      backgroundColor: theme.colors.elevation.level3,
      marginTop: theme.spacing.xs,
    },
    content: {
      flex: 1,
    },
    listContent: {
      paddingVertical: theme.spacing.m,
    },
    productCard: {
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.s,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      elevation: 1,
    },
    productHeader: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    productTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    productImage: {
      marginRight: theme.spacing.m,
    },
    productInfo: {
      flex: 1,
    },
    productName: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    variantText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    productStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    statusChip: {
      height: 28,
    },
    chipText: {
      fontSize: 12,
      marginHorizontal: theme.spacing.xs,
      marginVertical: 2,
    },
    ingredientCount: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    countsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    countText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    countDivider: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginHorizontal: 2,
    },
    productActions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginLeft: theme.spacing.s,
    },
    actionButton: {
      margin: 0,
      width: 48,
      height: 48,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder="Buscar pizzas..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={0}
            inputStyle={{ color: theme.colors.onSurface }}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            iconColor={theme.colors.onSurfaceVariant}
          />
          <View style={styles.filterButtonContainer}>
            <Menu
              visible={filterMenuVisible}
              onDismiss={() => setFilterMenuVisible(false)}
              anchor={
                <IconButton
                  icon={hasActiveFilter ? 'filter-check' : 'filter-variant'}
                  mode="contained-tonal"
                  size={24}
                  onPress={() => setFilterMenuVisible(true)}
                  style={styles.filterIconButton}
                  iconColor={
                    hasActiveFilter
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                />
              }
              anchorPosition="bottom"
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => {
                  setFilter('all');
                  setFilterMenuVisible(false);
                }}
                title="Todas"
                leadingIcon="filter-variant"
                trailingIcon={filter === 'all' ? 'check' : undefined}
                titleStyle={
                  filter === 'all'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
              <Menu.Item
                onPress={() => {
                  setFilter('configured');
                  setFilterMenuVisible(false);
                }}
                title="Configuradas"
                leadingIcon="check-circle"
                trailingIcon={filter === 'configured' ? 'check' : undefined}
                titleStyle={
                  filter === 'configured'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
              <Menu.Item
                onPress={() => {
                  setFilter('not_configured');
                  setFilterMenuVisible(false);
                }}
                title="Sin Configurar"
                leadingIcon="alert-circle"
                trailingIcon={filter === 'not_configured' ? 'check' : undefined}
                titleStyle={
                  filter === 'not_configured'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
            </Menu>
            {hasActiveFilter && <Badge style={styles.filterBadge} size={8} />}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No hay pizzas"
            message={
              filter === 'not_configured'
                ? 'No hay pizzas sin configurar'
                : filter === 'configured'
                  ? 'No hay pizzas configuradas'
                  : 'No hay productos tipo pizza creados'
            }
            icon="pizza"
          />
        }
      />

      <PizzaConfigurationModal
        visible={configModalVisible}
        onDismiss={() => {
          setConfigModalVisible(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <AssociatePizzaToppingsModal
        visible={ingredientsModalVisible}
        onDismiss={() => {
          setIngredientsModalVisible(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />
    </View>
  );
}
