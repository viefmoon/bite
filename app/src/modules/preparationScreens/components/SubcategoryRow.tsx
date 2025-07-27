import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text, Checkbox, IconButton } from 'react-native-paper';

interface Subcategory {
  id: string;
  name: string;
  photo: any;
  products: any[];
}

interface SubcategoryRowProps {
  subcategory: Subcategory;
  isExpanded: boolean;
  isFullySelected: boolean;
  isPartiallySelected: boolean;
  onToggleExpansion: (subcategoryId: string) => void;
  onToggleSelection: (subcategory: Subcategory) => void;
}

export const SubcategoryRow = memo<SubcategoryRowProps>(
  ({
    subcategory,
    isExpanded,
    isFullySelected,
    isPartiallySelected,
    onToggleExpansion,
    onToggleSelection,
  }) => {
    return (
      <View style={styles.subcategoryContainer}>
        <TouchableOpacity
          style={styles.subcategoryHeader}
          onPress={() => onToggleExpansion(subcategory.id)}
        >
          <View style={styles.subcategoryTitleContainer}>
            <IconButton
              icon={isExpanded ? 'chevron-down' : 'chevron-right'}
              size={16}
            />
            <Text variant="titleSmall" style={styles.subcategoryTitle}>
              {subcategory.name}
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
            onPress={() => onToggleSelection(subcategory)}
          />
        </TouchableOpacity>
      </View>
    );
  },
);

SubcategoryRow.displayName = 'SubcategoryRow';

const styles = StyleSheet.create({
  subcategoryContainer: {
    marginBottom: 4,
    paddingLeft: 20,
  },
  subcategoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  subcategoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subcategoryTitle: {
    fontWeight: '600',
  },
});
