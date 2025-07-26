import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, List } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type { OrderAdjustment } from '../../schema/adjustments.schema';

interface OrderAdjustmentsProps {
  adjustments: OrderAdjustment[];
  subtotal: number;
  onAddAdjustment?: () => void;
  onEditAdjustment?: (adjustment: OrderAdjustment) => void;
  onRemoveAdjustment?: (id: string) => void;
  disabled?: boolean;
  canManageAdjustments?: boolean;
}

export const OrderAdjustments: React.FC<OrderAdjustmentsProps> = ({
  adjustments,
  subtotal,
  onAddAdjustment,
  onEditAdjustment,
  onRemoveAdjustment,
  disabled = false,
  canManageAdjustments = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const calculateAdjustmentAmount = (adjustment: OrderAdjustment): number => {
    if (adjustment.isPercentage && adjustment.value) {
      return (subtotal * adjustment.value) / 100;
    }
    return adjustment.amount || 0;
  };

  if (!canManageAdjustments && adjustments.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Ajustes y Descuentos</Text>
        {canManageAdjustments && !disabled && (
          <IconButton
            icon="plus"
            size={20}
            onPress={onAddAdjustment}
            style={styles.addButton}
          />
        )}
      </View>

      {adjustments.length === 0 ? (
        <Text style={styles.emptyText}>No hay ajustes aplicados</Text>
      ) : (
        <View>
          {adjustments.map((adjustment) => {
            const amount = calculateAdjustmentAmount(adjustment);
            return (
              <List.Item
                key={adjustment.id}
                title={adjustment.name}
                description={adjustment.description}
                right={() => (
                  <View style={styles.rightContent}>
                    <Text style={styles.amountText}>-${amount.toFixed(2)}</Text>
                    {adjustment.isPercentage && (
                      <Text style={styles.percentageText}>
                        ({adjustment.value}%)
                      </Text>
                    )}
                    {canManageAdjustments && !disabled && (
                      <View style={styles.actionButtons}>
                        <IconButton
                          icon="pencil"
                          size={16}
                          onPress={() => onEditAdjustment?.(adjustment)}
                        />
                        <IconButton
                          icon="delete"
                          size={16}
                          onPress={() => onRemoveAdjustment?.(adjustment.id)}
                        />
                      </View>
                    )}
                  </View>
                )}
                style={styles.adjustmentItem}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.m,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    headerText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    addButton: {
      margin: -theme.spacing.s,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      paddingVertical: theme.spacing.m,
      textAlign: 'center',
    },
    adjustmentItem: {
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
    },
    rightContent: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    amountText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    percentageText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actionButtons: {
      flexDirection: 'row',
      marginTop: theme.spacing.xs,
    },
  });
