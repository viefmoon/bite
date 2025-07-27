import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type { Shift } from '@/app/schemas/domain/shift.schema';

interface ShiftSummaryCardProps {
  shift: Shift;
  formatTime: (dateString: string) => string;
  formatCurrency: (amount: number) => string;
}

export const ShiftSummaryCard: React.FC<ShiftSummaryCardProps> = ({
  shift,
  formatTime,
  formatCurrency,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={styles.summaryCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Resumen del Turno #{shift.globalShiftNumber}
        </Text>

        <View style={styles.summaryRow}>
          <Text variant="bodyMedium" style={styles.label}>
            Abierto a las:
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {formatTime(shift.openedAt)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text variant="bodyMedium" style={styles.label}>
            Efectivo inicial:
          </Text>
          <Text variant="bodyMedium" style={styles.value}>
            {formatCurrency(shift.initialCash)}
          </Text>
        </View>

        {shift.totalSales !== null && shift.totalSales !== undefined && (
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Ventas del turno:
            </Text>
            <Text variant="bodyMedium" style={[styles.value, styles.highlight]}>
              {formatCurrency(shift.totalSales)}
            </Text>
          </View>
        )}

        {shift.expectedCash !== null && shift.expectedCash !== undefined && (
          <View style={styles.summaryRow}>
            <Text variant="bodyMedium" style={styles.label}>
              Efectivo esperado:
            </Text>
            <Text variant="bodyMedium" style={[styles.value, styles.highlight]}>
              {formatCurrency(shift.expectedCash)}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    summaryCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 2,
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.m,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    label: {
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    value: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      textAlign: 'right',
    },
    highlight: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
