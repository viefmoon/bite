import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, IconButton, ActivityIndicator } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { PaymentStatusEnum } from '../schema/payment.schema';
import { formatPaymentMethod } from '../utils/formatters';

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
}

interface ExistingPaymentsListProps {
  payments: Payment[];
  isLoading: boolean;
  onDeletePayment: (paymentId: string) => void;
  isDeleting: boolean;
}

export const ExistingPaymentsList: React.FC<ExistingPaymentsListProps> = ({
  payments,
  isLoading,
  onDeletePayment,
  isDeleting,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatusEnum.COMPLETED:
        return '#4CAF50';
      case PaymentStatusEnum.PENDING:
        return theme.colors.primary;
      case PaymentStatusEnum.CANCELLED:
        return theme.colors.error;
      case PaymentStatusEnum.FAILED:
        return theme.colors.error;
      case PaymentStatusEnum.REFUNDED:
        return '#FF9800';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case PaymentStatusEnum.COMPLETED:
        return 'Completado';
      case PaymentStatusEnum.PENDING:
        return 'Pendiente';
      case PaymentStatusEnum.CANCELLED:
        return 'Cancelado';
      case PaymentStatusEnum.FAILED:
        return 'Fallido';
      case PaymentStatusEnum.REFUNDED:
        return 'Reembolsado';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  if (!payments || payments.length === 0) {
    return null;
  }

  return (
    <View style={styles.paymentsSection}>
      <Text style={styles.sectionTitle}>Pagos registrados</Text>
      {payments.map((payment) => (
        <View key={payment.id} style={styles.paymentItem}>
          <View style={styles.paymentLeftInfo}>
            <View style={styles.paymentMethodRow}>
              <Text style={styles.paymentMethodCompact}>
                {formatPaymentMethod(payment.paymentMethod)}
              </Text>
            </View>
            <Text style={styles.paymentDateCompact}>
              {new Date(payment.createdAt).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <View style={styles.paymentRightInfo}>
            <Text style={styles.paymentAmountCompact}>
              ${(payment.amount || 0).toFixed(2)}
            </Text>

            <Chip
              mode="flat"
              style={[
                styles.statusChipCompact,
                {
                  backgroundColor: getStatusColor(payment.paymentStatus),
                },
              ]}
              textStyle={styles.statusChipTextCompact}
            >
              {getStatusText(payment.paymentStatus)}
            </Chip>

            <IconButton
              icon="delete"
              size={20}
              iconColor={theme.colors.error}
              onPress={() => onDeletePayment(payment.id)}
              disabled={isDeleting}
              style={styles.deleteIconButton}
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    loader: {
      marginVertical: responsive.spacingPreset.xl,
    },
    paymentsSection: {
      paddingHorizontal: responsive.spacingPreset.m,
      paddingBottom: responsive.spacingPreset.s,
    },
    sectionTitle: {
      ...theme.fonts.titleSmall,
      color: theme.colors.onSurface,
      marginBottom: responsive.spacingPreset.s,
      fontWeight: '600',
    },
    paymentItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.spacingPreset.s,
      paddingHorizontal: responsive.spacingPreset.s,
      marginBottom: responsive.spacingPreset.xs,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      minHeight: 60,
    },
    paymentLeftInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    paymentMethodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    paymentMethodCompact: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    paymentDateCompact: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    paymentRightInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacingPreset.s,
    },
    paymentAmountCompact: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      minWidth: 70,
      textAlign: 'right',
    },
    statusChipCompact: {
      height: 28,
      minWidth: 80,
    },
    statusChipTextCompact: {
      color: 'white',
      fontSize: 11,
      fontWeight: '600',
    },
    deleteIconButton: {
      margin: 0,
      width: 32,
      height: 32,
    },
  });
