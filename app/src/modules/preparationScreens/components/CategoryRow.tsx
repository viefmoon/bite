import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Checkbox, IconButton, Divider } from 'react-native-paper';

interface Category {
  id: string;
  name: string;
  photo?: any;
  subcategories: any[];
}

interface CategoryRowProps {
  category: Category;
  isExpanded: boolean;
  isFullySelected: boolean;
  isPartiallySelected: boolean;
  onToggleExpansion: (categoryId: string) => void;
  onToggleSelection: (category: Category) => void;
}

export const CategoryRow = memo<CategoryRowProps>(
  ({
    category,
    isExpanded,
    isFullySelected,
    isPartiallySelected,
    onToggleExpansion,
    onToggleSelection,
  }) => {
    return (
      <View style={styles.categoryContainer}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => onToggleExpansion(category.id)}
        >
          <View style={styles.categoryTitleContainer}>
            <IconButton
              icon={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={20}
            />
            <Text variant="titleMedium" style={styles.categoryTitle}>
              {category.name}
            </Text>
          </View>
          <Checkbox.Android
            status={
              isFullySelected
                ? 'checked'
                : isPartiallySelected
                  ? 'indeterminate'
                  : 'unchecked'
            }
            onPress={() => onToggleSelection(category)}
          />
        </TouchableOpacity>
        <Divider style={styles.divider} />
      </View>
    );
  },
);

CategoryRow.displayName = 'CategoryRow';

const styles = StyleSheet.create({
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
  divider: {
    marginTop: 8,
  },
});
