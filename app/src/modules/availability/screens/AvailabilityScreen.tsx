import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Searchbar,
  SegmentedButtons,
  ActivityIndicator,
  Surface,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryAvailabilityItem } from '../components/CategoryAvailabilityItem';
import { ModifierGroupAvailabilityItem } from '../components/ModifierGroupAvailabilityItem';
import {
  useMenuAvailability,
  useModifierGroupsAvailability,
} from '../hooks/useAvailabilityQueries';
import EmptyState from '@/app/components/common/EmptyState';
import { useAppTheme } from '@/app/styles/theme';

export const AvailabilityScreen: React.FC = () => {
  const theme = useAppTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'menu' | 'modifiers'>('menu');

  const {
    data: menuData,
    isLoading: isLoadingMenu,
    refetch: refetchMenu,
  } = useMenuAvailability();

  const {
    data: modifiersData,
    isLoading: isLoadingModifiers,
    refetch: refetchModifiers,
  } = useModifierGroupsAvailability();

  const handleRefresh = useCallback(() => {
    if (viewMode === 'menu') {
      refetchMenu();
    } else {
      refetchModifiers();
    }
  }, [viewMode, refetchMenu, refetchModifiers]);

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

  const isLoading = viewMode === 'menu' ? isLoadingMenu : isLoadingModifiers;
  const isEmpty =
    viewMode === 'menu'
      ? filteredMenuData.length === 0
      : filteredModifiersData.length === 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <Surface style={styles.header} elevation={2}>
        <Searchbar
          placeholder={`Buscar ${viewMode === 'menu' ? 'productos' : 'modificadores'}...`}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          elevation={0}
          icon="magnify"
        />

        <SegmentedButtons
          value={viewMode}
          onValueChange={setViewMode as any}
          buttons={[
            {
              value: 'menu',
              label: 'Menú',
              icon: 'food',
            },
            {
              value: 'modifiers',
              label: 'Modificadores',
              icon: 'tune',
            },
          ]}
          style={styles.segmentedButtons}
        />
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
              Cargando {viewMode === 'menu' ? 'categorías' : 'modificadores'}...
            </Text>
          </View>
        ) : isEmpty ? (
          <EmptyState
            title="No se encontraron resultados"
            description={
              searchQuery
                ? 'Intenta con otros términos de búsqueda'
                : 'No hay elementos para mostrar'
            }
            icon="magnify"
          />
        ) : (
          <FlatList
            data={
              viewMode === 'menu' ? filteredMenuData : filteredModifiersData
            }
            keyExtractor={(item) => item.id}
            renderItem={({ item }) =>
              viewMode === 'menu' ? (
                <CategoryAvailabilityItem
                  category={item}
                  onRefresh={handleRefresh}
                />
              ) : (
                <ModifierGroupAvailabilityItem
                  modifierGroup={item}
                  onRefresh={handleRefresh}
                />
              )
            }
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  searchbar: {
    marginBottom: 12,
    borderRadius: 12,
    height: 48,
  },
  segmentedButtons: {
    marginBottom: 4,
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
