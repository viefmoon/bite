import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

interface PaymentSummaryProps {
  orderTotal: number;
  totalPaid?: number;
  pendingAmount?: number;
  mode?: 'payment' | 'prepayment';
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  orderTotal,
  totalPaid = 0,
  pendingAmount = 0,
  mode = 'payment',
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryAmount}>${orderTotal.toFixed(2)}</Text>
      </View>
      {mode !== 'prepayment' && (
        <>
          <View style={styles.summaryDividerVertical} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pagado</Text>
            <Text style={[styles.summaryAmount, styles.summaryAmountPaid]}>
              ${totalPaid.toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryDividerVertical} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryLabel, styles.summaryLabelPending]}>
              Pendiente
            </Text>
            <Text
              style={[
                styles.summaryAmount,
                styles.summaryAmountPendingBold,
                pendingAmount > 0
                  ? styles.summaryAmountError
                  : styles.summaryAmountPaid,
              ]}
            >
              ${pendingAmount.toFixed(2)}
            </Text>
          </View>
        </>
      )}
    </View>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      paddingVertical: responsive.spacingPreset.s,
      paddingHorizontal: responsive.spacingPreset.m,
      marginHorizontal: responsive.spacingPreset.m,
      marginTop: responsive.spacingPreset.s,
      marginBottom: responsive.spacingPreset.m,
      borderRadius: theme.roundness,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.fontSize(theme.fonts.bodySmall.fontSize),
      color: theme.colors.onPrimaryContainer,
      opacity: 0.8,
      marginBottom: 2,
    },
    summaryAmount: {
      ...theme.fonts.titleSmall,
      fontSize: responsive.fontSize(theme.fonts.titleSmall.fontSize),
      fontWeight: 'bold',
      color: theme.colors.onPrimaryContainer,
    },
    summaryDividerVertical: {
      width: 1,
      height: '80%',
      backgroundColor: theme.colors.onPrimaryContainer,
      opacity: 0.2,
      marginHorizontal: responsive.spacingPreset.xs,
    },
    summaryAmountPaid: {
      color: '#4CAF50',
    },
    summaryLabelPending: {
      fontWeight: 'bold',
    },
    summaryAmountPendingBold: {
      fontWeight: 'bold',
    },
    summaryAmountError: {
      color: theme.colors.error,
    },
  });
