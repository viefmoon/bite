import { memo, useMemo } from 'react';
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
import type { ProductVariant } from '../schema/orders.schema';
import type { AppTheme } from '@/app/styles/theme';

interface VariantSelectionGroupProps {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onVariantSelect: (variantId: string) => void;
  errorMessage?: string;
}

const VariantSelectionGroup = memo<VariantSelectionGroupProps>(
  ({ variants, selectedVariantId, onVariantSelect, errorMessage }) => {
    const theme = useAppTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);

    if (!variants || variants.length === 0) {
      return null;
    }

    return (
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Variantes</Text>
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
              <Chip mode="flat" compact style={styles.requiredChip}>
                Requerido
              </Chip>
            </View>
          </View>
          <RadioButton.Group
            onValueChange={(value) => onVariantSelect(value)}
            value={selectedVariantId || ''}
          >
            {variants.map((variant: ProductVariant) => (
              <Surface
                key={variant.id}
                style={[
                  styles.variantSurface,
                  selectedVariantId === variant.id &&
                    styles.variantSurfaceSelected,
                  !variant.isActive && styles.inactiveVariantSurface,
                ]}
                elevation={
                  selectedVariantId === variant.id && variant.isActive ? 2 : 0
                }
              >
                <TouchableRipple
                  onPress={() =>
                    variant.isActive && onVariantSelect(variant.id)
                  }
                  disabled={!variant.isActive}
                  style={styles.variantTouchable}
                >
                  <View style={styles.variantRow}>
                    <RadioButton
                      value={variant.id}
                      status={
                        selectedVariantId === variant.id
                          ? 'checked'
                          : 'unchecked'
                      }
                      onPress={() =>
                        variant.isActive && onVariantSelect(variant.id)
                      }
                      disabled={!variant.isActive}
                    />
                    <Text
                      style={[
                        styles.variantName,
                        !variant.isActive && styles.inactiveText,
                      ]}
                    >
                      {variant.name}
                      {!variant.isActive && ' (No disponible)'}
                    </Text>
                    <Text
                      style={[
                        styles.variantPrice,
                        !variant.isActive && styles.inactiveText,
                      ]}
                    >
                      ${variant.price.toFixed(2)}
                    </Text>
                  </View>
                </TouchableRipple>
              </Surface>
            ))}
          </RadioButton.Group>
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
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
      color: theme.colors.onSurface,
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
    variantSurface: {
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.surfaceVariant,
    },
    variantSurfaceSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    inactiveVariantSurface: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    variantTouchable: {
      padding: 0,
    },
    variantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    variantName: {
      flex: 1,
      fontSize: 16,
      marginLeft: theme.spacing.xs,
      color: theme.colors.onSurface,
    },
    variantPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.onSurfaceVariant,
      marginLeft: 'auto',
      marginRight: 8,
    },
    inactiveText: {
      color: theme.colors.onSurfaceDisabled,
      textDecorationLine: 'line-through',
    },
  });

VariantSelectionGroup.displayName = 'VariantSelectionGroup';

export default VariantSelectionGroup;
