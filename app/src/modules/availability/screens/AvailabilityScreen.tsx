import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, FlatList } from 'react-native';
import {
  Searchbar,
  SegmentedButtons,
  ActivityIndicator,
  Surface,
  Text,
  Menu,
  IconButton,
  Badge,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryAvailabilityItem } from '../components/CategoryAvailabilityItem';
import { ModifierGroupAvailabilityItem } from '../components/ModifierGroupAvailabilityItem';
import { PizzaCustomizationAvailabilityItem } from '../components/PizzaCustomizationAvailabilityItem';
import {
  useMenuAvailability,
  useModifierGroupsAvailability,
} from '../hooks/useAvailabilityQueries';
import { usePizzaCustomizationsAvailability } from '../hooks/usePizzaCustomizationsAvailability';
import EmptyState from '@/app/components/common/EmptyState';
import { useAppTheme } from '@/app/styles/theme';

export const AvailabilityScreen: React.FC = () => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<
    'menu' | 'modifiers' | 'pizzaCustomizations'
  >('menu');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const {
    data: menuData,
    isLoading: isLoadingMenu,
    isError: isErrorMenu,
    refetch: refetchMenu,
  } = useMenuAvailability();

  const {
    data: modifiersData,
    isLoading: isLoadingModifiers,
    isError: isErrorModifiers,
    refetch: refetchModifiers,
  } = useModifierGroupsAvailability();

  const {
    data: pizzaCustomizationsData,
    isLoading: isLoadingPizzaCustomizations,
    isError: isErrorPizzaCustomizations,
    refetch: refetchPizzaCustomizations,
  } = usePizzaCustomizationsAvailability(searchQuery);

  const handleRefresh = useCallback(() => {
    if (viewMode === 'menu') {
      refetchMenu();
    } else if (viewMode === 'modifiers') {
      refetchModifiers();
    } else {
      refetchPizzaCustomizations();
    }
  }, [viewMode, refetchMenu, refetchModifiers, refetchPizzaCustomizations]);

  const filteredMenuData = useMemo(() => {
    if (!menuData) return [];

    return menuData
      .map((category) => ({
        ...category,
        subcategories: category.subcategories
          .map((subcategory) => ({
            ...subcategory,
            products: subcategory.products.filter((product) => {
              const matchesSearch = product.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
              return matchesSearch;
            }),
          }))
          .filter((subcategory) => subcategory.products.length > 0),
      }))
      .filter((category) => category.subcategories.length > 0);
  }, [menuData, searchQuery]);

  const filteredModifiersData = useMemo(() => {
    if (!modifiersData) return [];

    return modifiersData
      .map((group) => ({
        ...group,
        modifiers: group.modifiers.filter((modifier) => {
          const matchesSearch = modifier.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
          return matchesSearch;
        }),
      }))
      .filter((group) => {
        const matchesSearch = group.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        return matchesSearch || group.modifiers.length > 0;
      });
  }, [modifiersData, searchQuery]);

  const isLoading =
    viewMode === 'menu'
      ? isLoadingMenu
      : viewMode === 'modifiers'
        ? isLoadingModifiers
        : isLoadingPizzaCustomizations;

  const isError =
    viewMode === 'menu'
      ? isErrorMenu
      : viewMode === 'modifiers'
        ? isErrorModifiers
        : isErrorPizzaCustomizations;

  const isEmpty =
    viewMode === 'menu'
      ? filteredMenuData.length === 0
      : viewMode === 'modifiers'
        ? filteredModifiersData.length === 0
        : !pizzaCustomizationsData || pizzaCustomizationsData.length === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Surface style={styles.header} elevation={2}>
        <View style={styles.searchRow}>
          <Searchbar
            placeholder={`Buscar ${viewMode === 'menu' ? 'productos' : viewMode === 'modifiers' ? 'modificadores' : 'ingredientes y sabores'}...`}
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={0}
            icon="magnify"
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
                  icon={
                    viewMode === 'menu'
                      ? 'food'
                      : viewMode === 'modifiers'
                        ? 'tune'
                        : 'cheese'
                  }
                  mode="contained-tonal"
                  size={24}
                  onPress={() => setFilterMenuVisible(true)}
                  style={styles.filterIconButton}
                />
              }
              anchorPosition="bottom"
              contentStyle={styles.menuContent}
            >
              <Menu.Item
                onPress={() => {
                  setViewMode('menu');
                  setFilterMenuVisible(false);
                }}
                title="Menú"
                leadingIcon="food"
                trailingIcon={viewMode === 'menu' ? 'check' : undefined}
                titleStyle={
                  viewMode === 'menu'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
              <Menu.Item
                onPress={() => {
                  setViewMode('modifiers');
                  setFilterMenuVisible(false);
                }}
                title="Modificadores"
                leadingIcon="tune"
                trailingIcon={viewMode === 'modifiers' ? 'check' : undefined}
                titleStyle={
                  viewMode === 'modifiers'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
              <Menu.Item
                onPress={() => {
                  setViewMode('pizzaCustomizations');
                  setFilterMenuVisible(false);
                }}
                title="Ingredientes Pizza"
                leadingIcon="cheese"
                trailingIcon={
                  viewMode === 'pizzaCustomizations' ? 'check' : undefined
                }
                titleStyle={
                  viewMode === 'pizzaCustomizations'
                    ? { color: theme.colors.primary, fontWeight: '600' }
                    : undefined
                }
              />
            </Menu>
          </View>
        </View>
      </Surface>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text
              style={[
                styles.loadingText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Cargando{' '}
              {viewMode === 'menu'
                ? 'categorías'
                : viewMode === 'modifiers'
                  ? 'modificadores'
                  : 'ingredientes'}
              ...
            </Text>
          </View>
        ) : isError ? (
          <EmptyState
            title="Error al cargar datos"
            message="No se pudieron cargar los datos. Verifica tu conexión."
            icon="alert-circle-outline"
            actionLabel="Reintentar"
            onAction={handleRefresh}
          />
        ) : isEmpty ? (
          <EmptyState
            title="No se encontraron resultados"
            message={
              searchQuery
                ? 'Intenta con otros términos de búsqueda'
                : 'No hay elementos para mostrar'
            }
            icon="magnify"
          />
        ) : viewMode === 'menu' ? (
          <FlatList
            data={filteredMenuData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CategoryAvailabilityItem
                category={item}
                onRefresh={handleRefresh}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        ) : viewMode === 'modifiers' ? (
          <FlatList
            data={filteredModifiersData}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ModifierGroupAvailabilityItem
                modifierGroup={item}
                onRefresh={handleRefresh}
              />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        ) : (
          <FlatList
            data={pizzaCustomizationsData || []}
            keyExtractor={(item) => item.type}
            renderItem={({ item }) => (
              <PizzaCustomizationAvailabilityItem group={item} />
            )}
            refreshControl={
              <RefreshControl
                refreshing={isLoading}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchbar: {
    flex: 1,
    borderRadius: 12,
    height: 48,
  },
  filterButtonContainer: {
    position: 'relative',
  },
  filterIconButton: {
    margin: 0,
  },
  menuContent: {
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingVertical: 12,
  },
});
