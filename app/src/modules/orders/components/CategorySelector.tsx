import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Card, Text } from 'react-native-paper';
import type { Category } from '../../../app/schemas/domain/category.schema';
import { useAppTheme } from '@/app/styles/theme';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

const CategorySelector = ({ 
  categories, 
  selectedCategoryId, 
  onSelectCategory 
}: CategorySelectorProps) => {
  const theme = useAppTheme();
  
  const styles = StyleSheet.create({
    categoriesContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.s,
      paddingBottom: theme.spacing.s,
    },
    categoryCard: {
      marginHorizontal: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedCategory: {
      backgroundColor: theme.colors.primary,
    },
    categoryText: {
      fontSize: 14,
      textAlign: 'center',
    },
    selectedCategoryText: {
      color: theme.colors.onPrimary,
    },
  });
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoriesContainer}
    >
      {categories.map((category) => (
        <Card
          key={category.id}
          style={[
            styles.categoryCard,
            selectedCategoryId === category.id && styles.selectedCategory,
          ]}
          onPress={() => onSelectCategory(category.id)}
        >
          <Text
            style={[
              styles.categoryText,
              selectedCategoryId === category.id && styles.selectedCategoryText,
            ]}
          >
            {category.name}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
};

export default CategorySelector;
