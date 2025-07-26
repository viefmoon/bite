import React, { useCallback, useMemo, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  StyleSheet,
  RefreshControl,
  ViewStyle,
  StyleProp,
  View,
  TextStyle,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import {
  List,
  Chip,
  Text,
  Surface,
  Searchbar,
  FAB,
  Portal,
  Menu,
  IconButton,
  Badge,
} from 'react-native-paper';
import AutoImage from '../common/AutoImage';
import { useAppTheme, AppTheme } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';
export interface FilterOption<TValue> {
  value: TValue;
  label: string;
  icon?: string;
  disabled?: boolean;
}

interface StatusConfig<TItem> {
  field: keyof TItem;
  activeValue: TItem[keyof TItem];
  activeLabel: string;
  inactiveLabel: string;
}

export interface RenderItemConfig<TItem> {
  titleField: keyof TItem;
  descriptionField?: keyof TItem;
  descriptionFormatter?: (value: any) => string | undefined;
  descriptionMaxLength?: number;
  priceField?: keyof TItem;
  sortOrderField?: keyof TItem;
  imageField?: keyof TItem;
  isDefaultField?: keyof TItem;
  statusConfig?: StatusConfig<TItem>;
  renderTitle?: (item: TItem) => React.ReactNode;
  renderDescription?: (item: TItem) => React.ReactNode;
}

interface GenericListProps<TItem extends { id: string }> {
  items: TItem[];
  renderConfig: RenderItemConfig<TItem>;
  onItemPress: (item: TItem) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  ListEmptyComponent: React.ComponentType<any> | React.ReactElement | null;
  isLoading?: boolean;
  listItemStyle?: StyleProp<ViewStyle>;
  listItemContentStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ViewStyle>;
  itemActionsContainerStyle?: StyleProp<ViewStyle>;
  renderItemActions?: (item: TItem) => React.ReactNode;
  renderItem?: ({ item }: { item: TItem }) => React.ReactElement;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  enableSort?: boolean;
  filterValue?: string | number;
  onFilterChange?: (value: string | number) => void;
  filterOptions?: FilterOption<string | number>[];
  showFab?: boolean;
  onFabPress?: () => void;
  fabIcon?: string;
  fabLabel?: string;
  fabVisible?: boolean;
  showImagePlaceholder?: boolean;
  placeholderIcon?: string;
  isModalOpen?: boolean;
  isDrawerOpen?: boolean;
  enableGrid?: boolean;
  gridColumns?: number;
  gridColumnsTablet?: number;
  minItemWidth?: number;
  itemSpacing?: number;
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
  itemSpacing?: number,
) => {
  const listItemHorizontalMargin = responsive.spacing(theme.spacing.m);
  return StyleSheet.create({
    listContainer: {
      flex: 1,
    },
    searchbarContainer: {
      paddingHorizontal:
        listItemHorizontalMargin - responsive.spacing(theme.spacing.xs),
      paddingTop: responsive.spacing(theme.spacing.xs),
      paddingBottom: responsive.spacing(theme.spacing.s),
      backgroundColor: theme.colors.background,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacing(theme.spacing.s),
    },
    searchbar: {
      flex: 1,
      backgroundColor: theme.colors.elevation.level2,
    },
    searchbarWithFilter: {
      flex: 1,
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
      marginTop: responsive.spacing(theme.spacing.xs),
    },
    listItem: {
      backgroundColor: theme.colors.surface,
      marginVertical: responsive.isTablet
        ? responsive.spacing(3)
        : responsive.spacing(4),
      marginHorizontal: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      borderRadius: theme.roundness * 1.5,
      elevation: 1,
      overflow: 'hidden',
    },
    gridListItem: {
      backgroundColor: theme.colors.surface,
      flex: 1,
      marginHorizontal: responsive.spacing(theme.spacing.xs),
      marginVertical: responsive.spacing(theme.spacing.xs),
      borderRadius: theme.roundness * 2,
      elevation: 2,
      overflow: 'hidden',
    },
    listItemContent: {
      paddingVertical: responsive.isTablet
        ? 4
        : responsive.spacing(theme.spacing.s),
      paddingHorizontal: responsive.spacing(theme.spacing.xs),
      minHeight: responsive.isTablet ? 40 : 56,
      flexWrap: 'wrap',
      alignItems: 'flex-start',
    },
    listItemImage: {
      width: responsive.isTablet ? 36 : 40,
      height: responsive.isTablet ? 36 : 40,
      borderRadius: theme.roundness,
      marginLeft: responsive.spacing(theme.spacing.xs),
      marginRight: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      backgroundColor: theme.colors.surfaceDisabled,
    },
    gridItemImage: {
      width: responsive.scaleWidth(64),
      height: responsive.scaleWidth(64),
      borderRadius: theme.roundness,
      marginLeft: responsive.spacing(theme.spacing.s),
      marginRight: responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surfaceDisabled,
    },
    statusChip: {
      borderRadius: theme.roundness * 1.5,
      height: responsive.isTablet ? 32 : 28,
      alignSelf: 'center',
      paddingHorizontal: responsive.spacing(theme.spacing.s),
    },
    title: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 15 : 14,
      lineHeight: responsive.isTablet ? 20 : 18,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 13 : 12,
      lineHeight: responsive.isTablet ? 18 : 16,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing(theme.spacing.l),
    },
    defaultContentContainer: {
      paddingBottom: 80,
      paddingTop: responsive.spacing(theme.spacing.xs),
    },
    itemActionsContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: responsive.spacing(theme.spacing.xs),
    },
    filtersOuterContainer: {
      paddingTop: responsive.spacing(theme.spacing.s),
      paddingBottom: responsive.spacing(theme.spacing.xs),
      paddingHorizontal: responsive.spacing(theme.spacing.xs),
      backgroundColor: theme.colors.background,
    },
    segmentedButtons: {
      backgroundColor: 'transparent',
      borderRadius: theme.roundness,
      minHeight: 40,
    },
    filterButton: {
      borderWidth: 0,
      paddingVertical: responsive.spacing(theme.spacing.xs),
    },
    filterButtonLabel: {
      fontSize: 15,
      letterSpacing: 0.15,
      paddingVertical: responsive.spacing(theme.spacing.xs),
    },
    fab: {
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    chipTextStyle: {
      fontSize: responsive.isTablet ? 12 : 11,
      marginVertical: 0,
    },
    searchInputStyle: {
      color: theme.colors.onSurface,
      fontSize: 14,
      minHeight: 40,
    },
    itemSeparator: {
      height: itemSpacing || responsive.spacing(theme.spacing.m),
    },
    fabTheme: {
      colors: { primaryContainer: theme.colors.primary },
    } as any,
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    selectedMenuItemTitle: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
};

const GenericList = <TItem extends { id: string }>({
  items,
  renderConfig,
  onItemPress,
  onRefresh,
  isRefreshing,
  ListEmptyComponent,
  listItemStyle,
  listItemContentStyle,
  contentContainerStyle,
  imageStyle,
  renderItemActions,
  itemActionsContainerStyle,
  enableSearch = false,
  searchPlaceholder = 'Buscar...',
  enableSort = false,
  filterValue,
  onFilterChange,
  filterOptions,
  searchQuery: externalSearchQuery,
  onSearchChange,
  showFab = false,
  onFabPress,
  fabIcon = 'plus',
  fabLabel,
  fabVisible = true,
  showImagePlaceholder = true,
  placeholderIcon = 'image-outline',
  isModalOpen = false,
  isDrawerOpen = false,
  renderItem,
  enableGrid = false,
  gridColumns = 1,
  gridColumnsTablet,
  minItemWidth,
  itemSpacing,
}: GenericListProps<TItem>) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = useMemo(
    () => getStyles(theme, responsive, itemSpacing),
    [theme, responsive, itemSpacing],
  );
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const isSearchControlled =
    externalSearchQuery !== undefined && onSearchChange !== undefined;
  const currentSearchTerm = isSearchControlled
    ? externalSearchQuery
    : internalSearchTerm;
  const isFocused = useIsFocused();

  const processedItems = useMemo(() => {
    let processed = [...items];

    if (enableSort && renderConfig.titleField) {
      processed.sort((a, b) => {
        const titleA = String(a[renderConfig.titleField] ?? '').toLowerCase();
        const titleB = String(b[renderConfig.titleField] ?? '').toLowerCase();
        return titleA.localeCompare(titleB);
      });
    }

    if (enableSearch && !isSearchControlled && currentSearchTerm.trim()) {
      const lowerCaseSearchTerm = currentSearchTerm.toLowerCase();
      processed = processed.filter((item) => {
        const title = String(item[renderConfig.titleField] ?? '').toLowerCase();
        if (title.includes(lowerCaseSearchTerm)) {
          return true;
        }
        if (renderConfig.descriptionField) {
          const description = String(
            item[renderConfig.descriptionField] ?? '',
          ).toLowerCase();
          if (description.includes(lowerCaseSearchTerm)) {
            return true;
          }
        }
        return false;
      });
    }

    return processed;
  }, [
    items,
    enableSort,
    enableSearch,
    isSearchControlled,
    currentSearchTerm,
    renderConfig,
  ]);

  const numColumns = useMemo(() => {
    if (!enableGrid) return 1;

    if (minItemWidth) {
      const gap = itemSpacing || responsive.spacing(theme.spacing.m);
      const padding = responsive.spacing(theme.spacing.m);
      return responsive.getGridColumns(minItemWidth, gap, padding);
    }

    if (responsive.isTablet && gridColumnsTablet) {
      return gridColumnsTablet;
    }

    return gridColumns;
  }, [
    enableGrid,
    minItemWidth,
    itemSpacing,
    responsive,
    gridColumns,
    gridColumnsTablet,
    theme.spacing.m,
  ]);

  const renderGenericItem = useCallback(
    ({ item }: { item: TItem }) => {
      const title = String(item[renderConfig.titleField] ?? '');

      let description = '';
      if (
        renderConfig.descriptionField &&
        item.hasOwnProperty(renderConfig.descriptionField)
      ) {
        const fieldValue = item[renderConfig.descriptionField];
        if (renderConfig.descriptionFormatter) {
          const formattedDescription =
            renderConfig.descriptionFormatter(fieldValue);
          if (formattedDescription) {
            description = formattedDescription;
          }
        } else {
          const rawDescription = String(fieldValue || '');
          if (rawDescription && rawDescription.toLowerCase() !== 'null') {
            description = rawDescription;
          }
        }
      }

      let sortOrderString: string | null = null;
      if (
        renderConfig.sortOrderField &&
        item.hasOwnProperty(renderConfig.sortOrderField)
      ) {
        const sortOrderValue = item[renderConfig.sortOrderField];
        if (sortOrderValue !== null && sortOrderValue !== undefined) {
          sortOrderString = `Posicion: ${String(sortOrderValue)}`;
        }
      }

      let priceString: string | null = null;
      if (
        renderConfig.priceField &&
        item.hasOwnProperty(renderConfig.priceField)
      ) {
        const priceValue = item[renderConfig.priceField];
        if (priceValue !== null && priceValue !== undefined) {
          const numericPrice = Number(priceValue);
          if (!isNaN(numericPrice)) {
            priceString = `$${numericPrice.toFixed(2)}`;
          } else if (
            typeof priceValue === 'string' &&
            priceValue.trim() !== ''
          ) {
            priceString = String(priceValue);
          }
        }
      }

      let imageSource: string | undefined = undefined;
      if (
        renderConfig.imageField &&
        item.hasOwnProperty(renderConfig.imageField)
      ) {
        const imageFieldValue = item[renderConfig.imageField];
        if (
          typeof imageFieldValue === 'object' &&
          imageFieldValue !== null &&
          'path' in imageFieldValue &&
          typeof imageFieldValue.path === 'string'
        ) {
          imageSource = imageFieldValue.path;
        } else if (typeof imageFieldValue === 'string') {
          imageSource = imageFieldValue;
        }
      }

      let statusChip = null;
      if (
        renderConfig.statusConfig &&
        item.hasOwnProperty(renderConfig.statusConfig.field)
      ) {
        const { field, activeValue, activeLabel, inactiveLabel } =
          renderConfig.statusConfig;
        const isActive = item[field] === activeValue;
        const chipLabel = isActive ? activeLabel : inactiveLabel;

        statusChip = (props: {
          color: string;
          style?: StyleProp<TextStyle>;
        }) => (
          <Chip
            {...props}
            mode="flat"
            selectedColor={
              isActive ? theme.colors.success : theme.colors.onSurfaceVariant
            }
            style={[
              styles.statusChip,
              {
                backgroundColor: isActive
                  ? theme.colors.successContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
            textStyle={styles.chipTextStyle}
            compact
          >
            {chipLabel}
          </Chip>
        );
      }

      const isGrid = enableGrid && numColumns > 1;

      return (
        <Surface
          style={[
            isGrid ? styles.gridListItem : styles.listItem,
            listItemStyle,
          ]}
          elevation={1}
        >
          <List.Item
            title={() =>
              renderConfig.renderTitle ? (
                renderConfig.renderTitle(item)
              ) : (
                <Text variant="bodyLarge" style={styles.title}>
                  {title}
                </Text>
              )
            }
            description={() => {
              if (renderConfig.renderDescription) {
                return renderConfig.renderDescription(item);
              }

              const parts = [];

              if (
                renderConfig.isDefaultField &&
                item.hasOwnProperty(renderConfig.isDefaultField) &&
                item[renderConfig.isDefaultField] === true
              ) {
                parts.push('✓ Por defecto');
              }

              if (sortOrderString) {
                parts.push(sortOrderString);
              }

              if (description) {
                parts.push(description);
              }

              if (priceString) {
                parts.push(priceString);
              }

              const combinedText = parts.join(' - ');

              if (combinedText.trim()) {
                return (
                  <Text variant="bodySmall" style={styles.description}>
                    {combinedText}
                  </Text>
                );
              }
              return null;
            }}
            left={() => {
              if (imageSource || showImagePlaceholder) {
                return (
                  <AutoImage
                    source={imageSource}
                    placeholderIcon={placeholderIcon}
                    style={[
                      isGrid ? styles.gridItemImage : styles.listItemImage,
                      imageStyle,
                    ]}
                    contentFit="cover"
                    transition={300}
                  />
                );
              } else {
                return null;
              }
            }}
            right={() => (
              <View style={styles.rightContainer}>
                {statusChip && statusChip({ color: theme.colors.onSurface })}
                {renderItemActions && (
                  <View
                    style={[
                      styles.itemActionsContainer,
                      itemActionsContainerStyle,
                    ]}
                  >
                    {renderItemActions(item)}
                  </View>
                )}
              </View>
            )}
            onPress={() => onItemPress(item)}
            style={[styles.listItemContent, listItemContentStyle]}
          />
        </Surface>
      );
    },
    [
      theme,
      renderConfig,
      onItemPress,
      styles,
      listItemStyle,
      listItemContentStyle,
      imageStyle,
      renderItemActions,
      itemActionsContainerStyle,
      enableGrid,
      numColumns,
      showImagePlaceholder,
      placeholderIcon,
    ],
  );

  const finalContentContainerStyle = useMemo(() => {
    return StyleSheet.flatten([
      styles.defaultContentContainer,
      contentContainerStyle,
    ]);
  }, [styles.defaultContentContainer, contentContainerStyle]);

  const hasActiveFilter = filterValue !== 'all' && filterValue !== undefined;

  return (
    <View style={styles.listContainer}>
      {(enableSearch ||
        (filterOptions && filterValue !== undefined && onFilterChange)) && (
        <View style={styles.searchbarContainer}>
          <View style={styles.searchRow}>
            {enableSearch && (
              <Searchbar
                placeholder={searchPlaceholder}
                onChangeText={
                  isSearchControlled ? onSearchChange : setInternalSearchTerm
                }
                value={currentSearchTerm}
                style={[
                  styles.searchbar,
                  filterOptions ? styles.searchbarWithFilter : {},
                ]}
                inputStyle={styles.searchInputStyle}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                iconColor={theme.colors.onSurfaceVariant}
                clearIcon={
                  currentSearchTerm
                    ? () => <List.Icon icon="close-circle" />
                    : undefined
                }
                onClearIconPress={() =>
                  isSearchControlled
                    ? onSearchChange('')
                    : setInternalSearchTerm('')
                }
              />
            )}
            {filterOptions && filterValue !== undefined && onFilterChange && (
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
                  {filterOptions.map((option) => (
                    <Menu.Item
                      key={String(option.value)}
                      onPress={() => {
                        onFilterChange(option.value);
                        setFilterMenuVisible(false);
                      }}
                      title={option.label}
                      leadingIcon={option.icon}
                      trailingIcon={
                        filterValue === option.value ? 'check' : undefined
                      }
                      disabled={option.disabled}
                      titleStyle={
                        filterValue === option.value
                          ? styles.selectedMenuItemTitle
                          : undefined
                      }
                    />
                  ))}
                </Menu>
                {hasActiveFilter && (
                  <Badge style={styles.filterBadge} size={8} />
                )}
              </View>
            )}
          </View>
        </View>
      )}

      <FlashList
        data={processedItems}
        renderItem={renderItem || renderGenericItem}
        keyExtractor={(item) => item.id}
        estimatedItemSize={enableGrid && numColumns > 1 ? 150 : 80}
        numColumns={numColumns}
        contentContainerStyle={finalContentContainerStyle}
        ListEmptyComponent={
          processedItems.length === 0 ? ListEmptyComponent || null : null
        }
        ItemSeparatorComponent={
          enableGrid && numColumns > 1
            ? () => <View style={styles.itemSeparator} />
            : undefined
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              if (isSearchControlled) {
                onSearchChange('');
              } else {
                setInternalSearchTerm('');
              }
              onRefresh();
            }}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        keyboardShouldPersistTaps="handled"
      />
      {showFab && onFabPress && (
        <Portal>
          <FAB
            icon={fabIcon}
            style={styles.fab}
            onPress={onFabPress}
            visible={
              isFocused &&
              showFab &&
              fabVisible &&
              !isModalOpen &&
              !isDrawerOpen
            }
            label={fabLabel}
            color={theme.colors.onPrimary}
            theme={styles.fabTheme}
          />
        </Portal>
      )}
    </View>
  );
};

export default GenericList;
