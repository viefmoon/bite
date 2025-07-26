import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, Button } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';

interface PrepaymentSectionProps {
  isEditMode: boolean;
  prepaymentId: string | null;
  paymentAmount: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | null;
  total: number;
  totalPaid?: number;
  pendingAmount?: number;
  canRegisterPayments?: boolean;
  onShowPrepaymentModal: () => void;
  onDeletePrepayment: () => void;
}

export const PrepaymentSection: React.FC<PrepaymentSectionProps> = ({
  isEditMode,
  prepaymentId,
  paymentAmount,
  paymentMethod,
  total,
  totalPaid,
  pendingAmount,
  canRegisterPayments = true,
  onShowPrepaymentModal,
  onDeletePrepayment,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const parsedPaymentAmount = parseFloat(paymentAmount || '0');
  const exceedsTotal = parsedPaymentAmount > total;
  const remainingAmount = Math.max(0, total - parsedPaymentAmount);

  // En modo edición, mostrar los montos pagados
  if (isEditMode) {
    return (
      <>
        <View style={styles.totalsContainer}>
          <Text style={styles.totalsText}>Pagado:</Text>
          <Text style={[styles.totalsValue, styles.paidAmount]}>
            ${(totalPaid || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.totalsContainer}>
          <Text style={[styles.totalsText, styles.boldText]}>Restante:</Text>
          <Text
            style={[
              styles.totalsValue,
              styles.boldText,
              {
                color:
                  (pendingAmount || 0) > 0 ? theme.colors.error : '#4CAF50',
              },
            ]}
          >
            ${(pendingAmount || 0).toFixed(2)}
          </Text>
        </View>
      </>
    );
  }

  // Si hay prepago registrado
  if (prepaymentId) {
    return (
      <>
        <View style={styles.prepaymentSection}>
          <View style={styles.prepaymentHeader}>
            <Text style={styles.prepaymentTitle}>Prepago registrado</Text>
            <View style={styles.prepaymentActions}>
              <IconButton
                icon="pencil"
                size={28}
                iconColor={theme.colors.primary}
                onPress={onShowPrepaymentModal}
                style={styles.prepaymentIconButton}
              />
              <IconButton
                icon="delete"
                size={28}
                iconColor={theme.colors.error}
                onPress={onDeletePrepayment}
                style={styles.prepaymentIconButton}
              />
            </View>
          </View>
          <View style={styles.totalsContainer}>
            <Text style={styles.totalsText}>Monto pagado:</Text>
            <Text style={[styles.totalsValue, styles.paidAmount]}>
              ${parsedPaymentAmount.toFixed(2)}
            </Text>
          </View>
          {exceedsTotal && (
            <View style={styles.prepaymentWarning}>
              <IconButton
                icon="alert-circle"
                size={16}
                iconColor={theme.colors.error}
                style={styles.iconButtonNoMargin}
              />
              <Text style={styles.prepaymentWarningText}>
                El prepago excede el total de la orden. Edite el pago antes de
                continuar.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.totalsContainer}>
          <Text style={[styles.totalsText, styles.boldText]}>Restante:</Text>
          <Text
            style={[
              styles.totalsValue,
              styles.boldText,
              {
                color: remainingAmount === 0 ? '#4CAF50' : theme.colors.error,
              },
            ]}
          >
            ${remainingAmount.toFixed(2)}
          </Text>
        </View>
      </>
    );
  }

  // Si puede registrar pagos y no hay prepago
  if (canRegisterPayments) {
    return (
      <View style={styles.paymentButtonContainer}>
        <Button
          mode="outlined"
          onPress={onShowPrepaymentModal}
          style={styles.paymentButton}
          icon="credit-card"
        >
          💵 Registrar pago con la orden
        </Button>
      </View>
    );
  }

  return null;
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    prepaymentSection: {
      marginBottom: theme.spacing.s,
      paddingHorizontal: theme.spacing.xs,
    },
    prepaymentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
    },
    prepaymentTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    prepaymentActions: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    prepaymentIconButton: {
      margin: 0,
    },
    prepaymentWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.errorContainer,
      borderRadius: theme.roundness,
      padding: theme.spacing.s,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    prepaymentWarningText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onErrorContainer,
      marginLeft: theme.spacing.xs,
    },
    totalsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.xs,
    },
    totalsText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    totalsValue: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    paidAmount: {
      color: '#4CAF50',
    },
    boldText: {
      fontWeight: 'bold',
    },
    paymentButtonContainer: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    paymentButton: {
      marginVertical: theme.spacing.xs,
    },
    iconButtonNoMargin: {
      margin: 0,
    },
  });
