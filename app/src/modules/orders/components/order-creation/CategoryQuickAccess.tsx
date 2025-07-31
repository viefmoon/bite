import { memo, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { Category } from '../../schema/orders.schema';

interface CategoryQuickAccessProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string) => void;
}

export const CategoryQuickAccess = memo<CategoryQuickAccessProps>(
  ({ categories, selectedCategoryId, onCategorySelect }) => {
    const theme = useAppTheme();

    const styles = useMemo(
      () =>
        StyleSheet.create({
          container: {
            backgroundColor: theme.colors.background,
            paddingTop: theme.spacing.s,
            paddingBottom: 0,
            paddingHorizontal: theme.spacing.m,
          },
          scrollContent: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: theme.spacing.xs,
          },
          categoryChip: {
            flexBasis: '23%',
            maxWidth: '23%',
          },
          categoryChipInner: {
            paddingHorizontal: theme.spacing.m,
            paddingVertical: theme.spacing.s,
            borderRadius: theme.roundness,
            borderWidth: 1,
            borderColor: theme.colors.surfaceVariant,
            backgroundColor: theme.colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 40,
          },
          categoryChipSelected: {
            backgroundColor: theme.colors.primaryContainer,
            borderColor: theme.colors.primary,
            elevation: 2,
          },
          categoryChipInactive: {
            opacity: 0.5,
          },
          categoryText: {
            fontSize: 17,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.colors.onSurface,
          },
          categoryTextSelected: {
            color: theme.colors.primary,
            fontWeight: 'bold',
          },
          categoryTextInactive: {
            color: theme.colors.onSurfaceDisabled,
          },
        }),
      [theme],
    );

    const activeCategories = useMemo(
      () => categories.filter((cat) => cat.isActive !== false),
      [categories],
    );

    if (activeCategories.length === 0) {
      return null;
    }

    return (
      <View style={styles.container}>
        <View style={styles.scrollContent}>
          {activeCategories.map((category) => {
            const isSelected = category.id === selectedCategoryId;
            const isInactive = category.isActive === false;

            return (
              <Pressable
                key={category.id}
                style={styles.categoryChip}
                onPress={() => !isInactive && onCategorySelect(category.id)}
                disabled={isInactive}
              >
                <View
                  style={[
                    styles.categoryChipInner,
                    isSelected && styles.categoryChipSelected,
                    isInactive && styles.categoryChipInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      isSelected && styles.categoryTextSelected,
                      isInactive && styles.categoryTextInactive,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {category.name}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  },
);
