import React, { ReactElement } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';
import { useDrawerStatus } from '@react-navigation/drawer';
import GenericList, { FilterOption, RenderItemConfig } from './GenericList';
import { useListState } from '../../hooks/useListState';
import { useAppTheme, AppTheme } from '../../styles/theme';

interface CrudListScreenProps<TItem extends { id: string }> {
  // Data props
  items: TItem[];
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRefresh: () => void;

  // List configuration
  renderConfig: RenderItemConfig<TItem>;
  onItemPress: (item: TItem) => void;
  renderItemActions?: (item: TItem) => React.ReactNode;

  // Search & Filter
  enableSearch?: boolean;
  searchPlaceholder?: string;
  enableSort?: boolean;
  filterOptions?: FilterOption<string | number>[];
  filterValue?: string | number;
  onFilterChange?: (value: string | number) => void;

  // FAB
  showFab?: boolean;
  onFabPress?: () => void;
  fabIcon?: string;
  fabLabel?: string;

  // Empty state
  emptyStateConfig: {
    title: string;
    message?: string;
    icon?: string;
  };

  // Modals
  modals?: ReactElement[];
  isModalOpen?: boolean;

  // Styling
  showImagePlaceholder?: boolean;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listStyle: {
      flex: 1,
    },
    listContentContainer: {
      paddingBottom: 80,
    },
  });

export function CrudListScreen<TItem extends { id: string }>({
  items,
  isLoading,
  isError,
  isFetching,
  onRefresh,
  renderConfig,
  onItemPress,
  renderItemActions,
  enableSearch = true,
  searchPlaceholder = 'Buscar...',
  enableSort = true,
  filterOptions,
  filterValue,
  onFilterChange,
  showFab = true,
  onFabPress,
  fabIcon = 'plus',
  fabLabel,
  emptyStateConfig,
  modals = [],
  isModalOpen = false,
  showImagePlaceholder = true,
}: CrudListScreenProps<TItem>) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError,
    data: items,
    emptyConfig: emptyStateConfig,
  });

  return (
    <View style={styles.container}>
      <GenericList<TItem>
        items={items}
        enableSort={enableSort}
        enableSearch={enableSearch}
        searchPlaceholder={searchPlaceholder}
        filterValue={filterValue}
        onFilterChange={onFilterChange}
        filterOptions={filterOptions}
        renderConfig={renderConfig}
        onItemPress={onItemPress}
        onRefresh={onRefresh}
        isRefreshing={isFetching && !isLoading}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoading}
        contentContainerStyle={styles.listContentContainer}
        listStyle={styles.listStyle}
        renderItemActions={renderItemActions}
        showFab={showFab}
        onFabPress={onFabPress}
        fabIcon={fabIcon}
        fabLabel={fabLabel}
        isModalOpen={isModalOpen}
        showImagePlaceholder={showImagePlaceholder}
        isDrawerOpen={isDrawerOpen}
      />

      {modals.length > 0 && <Portal>{modals}</Portal>}
    </View>
  );
}
