import { memo, useMemo, ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  RadioButton,
  TouchableRipple,
  Card,
  Chip,
  Surface,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type { AppTheme } from '@/app/styles/theme';

export interface SelectionItem {
  id: string;
  name: string;
  price?: number;
  isActive: boolean;
}

export interface SelectionGroupProps<T extends SelectionItem> {
  title: string;
  items: T[];
  selectedIds: string[];
  onSelect: (itemId: string) => void;
  isRequired?: boolean;
  allowMultipleSelections?: boolean;
  errorMessage?: string;
  selectionRules?: string;
  renderItemContent?: (item: T, isSelected: boolean) => ReactNode;
}

const SelectionGroup = memo<SelectionGroupProps<any>>(
  ({
    title,
    items,
    selectedIds,
    onSelect,
    isRequired = false,
    allowMultipleSelections = false,
    errorMessage,
    selectionRules,
    renderItemContent,
  }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (!items || items.length === 0) {
      return null;
    }

    const defaultRenderItemContent = (
      item: SelectionItem,
      _isSelected: boolean,
    ) => (
      <>
        <Text style={[styles.itemName, !item.isActive && styles.inactiveText]}>
          {item.name}
          {!item.isActive && ' (No disponible)'}
        </Text>
        {(item.price || 0) > 0 && (
          <Text
            style={[styles.itemPrice, !item.isActive && styles.inactiveText]}
          >
            {allowMultipleSelections ? '+' : ''}${(item.price || 0).toFixed(2)}
          </Text>
        )}
      </>
    );

    const renderContent = renderItemContent || defaultRenderItemContent;

    const renderSelectionItems = () => {
      return items.map((item) => {
        const isSelected = selectedIds.includes(item.id);

        return (
          <Surface
            key={item.id}
            style={[
              styles.itemSurface,
              isSelected && styles.itemSurfaceSelected,
              !item.isActive && styles.inactiveItemSurface,
            ]}
            elevation={isSelected && item.isActive ? 1 : 0}
          >
            <TouchableRipple
              onPress={() => item.isActive && onSelect(item.id)}
              disabled={!item.isActive}
              style={styles.itemTouchable}
            >
              <View style={styles.itemRow}>
                <RadioButton
                  value={item.id}
                  status={isSelected ? 'checked' : 'unchecked'}
                  disabled={!item.isActive}
                  onPress={() => item.isActive && onSelect(item.id)}
                />
                {renderContent(item, isSelected)}
              </View>
            </TouchableRipple>
          </Surface>
        );
      });
    };

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
              {selectionRules && (
                <Text style={styles.selectionRules}>{selectionRules}</Text>
              )}
              {allowMultipleSelections && (
                <Text style={styles.selectedCount}>
                  ({selectedIds.length} seleccionadas)
                </Text>
              )}
            </View>
            <View style={styles.chipContainer}>
              {errorMessage && (
                <Chip
                  mode="flat"
                  compact
                  style={styles.errorChip}
                  icon="alert-circle"
                  textStyle={styles.errorChipText}
                >
                  {errorMessage}
                </Chip>
              )}
              <Chip
                mode="flat"
                compact
                style={isRequired ? styles.requiredChip : styles.optionalChip}
              >
                {isRequired ? 'Requerido' : 'Opcional'}
              </Chip>
            </View>
          </View>

          {allowMultipleSelections ? (
            <View style={styles.itemsContainer}>{renderSelectionItems()}</View>
          ) : (
            <RadioButton.Group
              onValueChange={(value) => onSelect(value)}
              value={selectedIds[0] || ''}
            >
              <View style={styles.itemsContainer}>
                {renderSelectionItems()}
              </View>
            </RadioButton.Group>
          )}
        </Card.Content>
      </Card>
    );
  },
);

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    sectionCard: {
      marginBottom: theme.spacing.m,
      borderRadius: theme.roundness * 2,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.onSurface,
    },
    selectionRules: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
      fontStyle: 'italic',
      marginTop: 2,
    },
    selectedCount: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '500',
      marginTop: 2,
    },
    chipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    errorChip: {
      backgroundColor: theme.colors.errorContainer,
      marginRight: theme.spacing.xs,
    },
    errorChipText: {
      fontSize: 12,
    },
    requiredChip: {
      backgroundColor: theme.colors.errorContainer,
      marginLeft: theme.spacing.s,
    },
    optionalChip: {
      backgroundColor: theme.colors.secondaryContainer,
      marginLeft: theme.spacing.s,
    },
    itemsContainer: {
      marginTop: theme.spacing.xs,
    },
    itemSurface: {
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    itemSurfaceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    inactiveItemSurface: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    itemTouchable: {
      padding: 0,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    itemName: {
      flex: 1,
      fontSize: 15,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    itemPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant,
      marginLeft: 'auto',
      paddingHorizontal: 8,
    },
    inactiveText: {
      color: theme.colors.onSurfaceDisabled,
      textDecorationLine: 'line-through',
    },
  });

SelectionGroup.displayName = 'SelectionGroup';

export default SelectionGroup;
