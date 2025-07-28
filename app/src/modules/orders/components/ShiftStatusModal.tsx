import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, Chip, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import { useResponsive } from '@/app/hooks/useResponsive';
import { type Shift } from '@/services/shifts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ShiftStatusModalProps {
  visible: boolean;
  onDismiss: () => void;
  shift: Shift | null;
  onOpenShift: () => void;
  onCloseShift?: () => void;
  canOpenShift: boolean;
  loading: boolean;
}

export const ShiftStatusModal: React.FC<ShiftStatusModalProps> = ({
  visible,
  onDismiss,
  shift,
  onOpenShift,
  onCloseShift,
  canOpenShift,
  loading,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );

  const isShiftOpen = shift && shift.status === 'OPEN';
  const today = new Date();
  const todayFormatted = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const handleOpenShift = React.useCallback(() => {
    onDismiss();
    onOpenShift();
  }, [onDismiss, onOpenShift]);

  const handleCloseShift = React.useCallback(() => {
    onDismiss();
    onCloseShift?.();
  }, [onDismiss, onCloseShift]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: es });
  };

  // Construir acciones dinámicamente
  const modalActions = React.useMemo(() => {
    const actions: Array<{
      label: string;
      mode?: 'text' | 'outlined' | 'contained';
      onPress: () => void;
      colorPreset?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
      icon?: string;
    }> = [
      {
        label: 'Cerrar',
        mode: 'text',
        onPress: onDismiss,
        colorPreset: 'secondary',
      },
    ];

    if (!isShiftOpen && canOpenShift) {
      actions.push({
        label: 'Abrir Turno',
        mode: 'contained',
        onPress: handleOpenShift,
        icon: 'play-circle',
        colorPreset: 'success',
      });
    }

    if (isShiftOpen && canOpenShift && onCloseShift) {
      actions.push({
        label: 'Cerrar Turno',
        mode: 'contained',
        onPress: handleCloseShift,
        icon: 'stop-circle',
        colorPreset: 'warning',
      });
    }

    return actions;
  }, [isShiftOpen, canOpenShift, handleOpenShift, handleCloseShift, onDismiss]);

  const modalTitle = isShiftOpen ? 'Turno Abierto' : 'Turno Cerrado';

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      preset="detail"
      title={modalTitle}
      actions={modalActions}
      isLoading={loading}
      dismissable={!loading}
    >
      {/* Status Header */}
      <Surface style={styles.statusCard} elevation={1}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={isShiftOpen ? 'store-check' : 'store-alert'}
            size={48}
            color={isShiftOpen ? theme.colors.success : theme.colors.warning}
          />
        </View>
        <Text variant="bodyLarge" style={styles.dateText}>
          {todayFormatted}
        </Text>
        <Chip
          mode="outlined"
          style={[
            styles.statusChip,
            {
              borderColor: isShiftOpen
                ? theme.colors.success
                : theme.colors.warning,
            },
          ]}
          textStyle={{
            color: isShiftOpen ? theme.colors.success : theme.colors.warning,
          }}
        >
          {isShiftOpen ? 'ABIERTO' : 'CERRADO'}
        </Chip>
      </Surface>

      {/* Content */}
      <View style={styles.content}>
        {isShiftOpen && shift ? (
          <>
            {/* Información del turno abierto */}
            <Card style={styles.infoCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Información del Turno
                </Text>

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Turno #:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {shift.globalShiftNumber}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Abierto a las:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {formatTime(shift.openedAt)}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Abierto por:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {shift.openedBy.firstName} {shift.openedBy.lastName}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Efectivo inicial:
                  </Text>
                  <Text variant="bodyMedium" style={styles.value}>
                    {formatCurrency(shift.initialCash)}
                  </Text>
                </View>

                {shift.totalSales !== null && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Ventas del turno:
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={[styles.value, styles.highlight]}
                    >
                      {formatCurrency(shift.totalSales)}
                    </Text>
                  </View>
                )}

                {shift.totalOrders !== null && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Órdenes:
                    </Text>
                    <Text variant="bodyMedium" style={styles.value}>
                      {shift.totalOrders}
                    </Text>
                  </View>
                )}

                {shift.expectedCash !== null && shift.expectedCash !== undefined && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Efectivo esperado:
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={[styles.value, styles.highlight]}
                    >
                      {formatCurrency(shift.expectedCash)}
                    </Text>
                  </View>
                )}

                {shift.notes && (
                  <View style={styles.notesSection}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Notas:
                    </Text>
                    <Text variant="bodySmall" style={styles.notes}>
                      {shift.notes}
                    </Text>
                  </View>
                )}
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
            {/* Turno cerrado */}
            <View style={styles.closedInfo}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={theme.colors.primary}
              />
              <Text variant="bodyMedium" style={styles.infoText}>
                {canOpenShift
                  ? 'El turno está cerrado. Para comenzar las operaciones, abre el turno.'
                  : 'El turno está cerrado. Contacta a un administrador para abrirlo.'}
              </Text>
            </View>
          </>
        )}
      </View>
    </ResponsiveModal>
  );
};

const createStyles = (
  theme: ReturnType<typeof useAppTheme>,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    statusCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 2,
      padding: responsive.spacing(theme.spacing.l),
      alignItems: 'center',
      marginBottom: responsive.spacing(theme.spacing.l),
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: responsive.spacing(theme.spacing.m),
      elevation: 2,
    },
    dateText: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      textTransform: 'capitalize',
      marginBottom: responsive.spacing(theme.spacing.m),
    },
    statusChip: {
      borderWidth: 2,
    },
    content: {
      gap: responsive.spacing(theme.spacing.m),
    },
    infoCard: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 2,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.m,
    },
    infoRow: {
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
    notesSection: {
      marginTop: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.m),
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    notes: {
      color: theme.colors.onSurfaceVariant,
      marginTop: responsive.spacing(theme.spacing.xs),
      fontStyle: 'italic',
    },
    closedInfo: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primaryContainer,
      padding: responsive.spacing(theme.spacing.m),
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: responsive.spacing(theme.spacing.s),
    },
    infoText: {
      flex: 1,
      color: theme.colors.onPrimaryContainer,
      lineHeight: 22,
    },
  });
