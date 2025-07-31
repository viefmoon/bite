import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
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
      {adjustments.length > 0 && (
        <>
          <View style={styles.header}>
            <Text style={styles.headerText}>Ajustes y Descuentos</Text>
          </View>
          <View>
            {adjustments.map((adjustment) => {
              const amount = calculateAdjustmentAmount(adjustment);
              return (
                <View key={adjustment.id} style={styles.adjustmentItem}>
                  <View style={styles.adjustmentContent}>
                    <View style={styles.adjustmentInfo}>
                      <Text style={styles.adjustmentName}>
                        {adjustment.name}
                      </Text>
                      {adjustment.isPercentage && (
                        <Text style={styles.percentageText}>
                          {Math.abs(adjustment.value || 0)}% del subtotal
                        </Text>
                      )}
                    </View>

                    <View style={styles.adjustmentActions}>
                      <View style={styles.priceContainer}>
                        <Text
                          style={[
                            styles.adjustmentAmount,
                            amount < 0
                              ? styles.discountText
                              : styles.chargeText,
                          ]}
                        >
                          {amount < 0 ? '-' : '+'}${Math.abs(amount).toFixed(2)}
                        </Text>
                      </View>

                      {canManageAdjustments && !disabled && (
                        <View style={styles.actionButtons}>
                          <IconButton
                            icon="pencil"
                            size={24}
                            onPress={() => onEditAdjustment?.(adjustment)}
                            style={styles.actionButton}
                          />
                          <IconButton
                            icon="delete"
                            size={24}
                            onPress={() =>
                              adjustment.id &&
                              onRemoveAdjustment?.(adjustment.id)
                            }
                            style={styles.actionButton}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {canManageAdjustments && !disabled && (
        <TouchableOpacity
          style={[
            styles.addButtonContainer,
            adjustments.length > 0 && styles.addButtonContainerWithMargin,
          ]}
          onPress={onAddAdjustment}
          activeOpacity={0.7}
        >
          <IconButton
            icon="plus-circle-outline"
            size={32}
            onPress={onAddAdjustment}
            style={styles.addButton}
            iconColor={theme.colors.primary}
          />
          <Text style={styles.addButtonText}>Agregar Ajuste o Descuento</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      marginVertical: theme.spacing.s,
    },
    header: {
      marginBottom: theme.spacing.s,
    },
    headerText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    adjustmentItem: {
      backgroundColor: theme.colors.surfaceVariant,
      marginBottom: theme.spacing.xs,
      borderRadius: theme.roundness,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    adjustmentContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    adjustmentInfo: {
      flex: 1,
      marginRight: theme.spacing.s,
    },
    adjustmentName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 2,
    },
    adjustmentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    priceContainer: {
      alignItems: 'flex-end',
      marginRight: theme.spacing.s,
    },
    adjustmentAmount: {
      fontSize: 16,
      fontWeight: '600',
    },
    discountText: {
      color: theme.colors.primary,
    },
    chargeText: {
      color: theme.colors.error,
    },
    percentageText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actionButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    actionButton: {
      margin: 0,
      width: 40,
      height: 40,
    },
    addButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.s,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderStyle: 'dashed',
      minHeight: 48,
    },
    addButtonContainerWithMargin: {
      marginTop: theme.spacing.s,
    },
    addButton: {
      margin: 0,
      marginRight: theme.spacing.s,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    },
  });
