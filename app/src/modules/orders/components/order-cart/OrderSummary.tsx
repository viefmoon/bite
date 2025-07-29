import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { formatCurrency } from '@/app/lib/formatters';

interface OrderSummaryProps {
  subtotal: number;
  adjustmentsTotal: number;
  total: number;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isProcessing?: boolean;
  disabled?: boolean;
  showCancelButton?: boolean;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotal,
  adjustmentsTotal,
  total,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar Orden',
  cancelText = 'Cancelar',
  isProcessing = false,
  disabled = false,
  showCancelButton = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <Divider style={styles.divider} />

      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>

        {adjustmentsTotal > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Descuentos:</Text>
            <Text style={[styles.summaryValue, styles.discountText]}>
              -{formatCurrency(adjustmentsTotal)}
            </Text>
          </View>
        )}

        <Divider style={styles.totalDivider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {showCancelButton && (
          <Button
            mode="outlined"
            onPress={onCancel}
            style={[styles.button, styles.cancelButton]}
            disabled={disabled || isProcessing}
          >
            {cancelText}
          </Button>
        )}

        <Button
          mode="contained"
          onPress={onConfirm}
          style={[styles.button, styles.confirmButton]}
          loading={isProcessing}
          disabled={disabled || isProcessing}
        >
          {confirmText}
        </Button>
      </View>
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.m,
    },
    divider: {
      marginBottom: theme.spacing.m,
    },
    summarySection: {
      paddingHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.s,
    },
    summaryLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    summaryValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    discountText: {
      color: theme.colors.primary,
    },
    totalDivider: {
      marginVertical: theme.spacing.s,
    },
    totalLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    buttonContainer: {
      flexDirection: 'row',
      paddingHorizontal: theme.spacing.m,
      gap: theme.spacing.s,
    },
    button: {
      flex: 1,
    },
    cancelButton: {
      borderColor: theme.colors.outline,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
  });
