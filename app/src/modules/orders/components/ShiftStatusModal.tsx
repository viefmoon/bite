import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Surface,
  Divider,
  Card,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
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
  loading: _loading,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const isShiftOpen = shift && shift.status === 'OPEN';
  const today = new Date();
  const todayFormatted = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const handleOpenShift = () => {
    onDismiss();
    onOpenShift();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: es });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <Surface style={styles.modal} elevation={3}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name={isShiftOpen ? 'store-check' : 'store-alert'}
                  size={48}
                  color={isShiftOpen ? '#4CAF50' : '#FF9800'}
                />
              </View>
              <Text variant="headlineMedium" style={styles.title}>
                {isShiftOpen ? 'Turno Abierto' : 'Turno Cerrado'}
              </Text>
              <Text variant="bodyLarge" style={styles.date}>
                {todayFormatted}
              </Text>
              <Chip
                mode="outlined"
                style={[
                  styles.statusChip,
                  { borderColor: isShiftOpen ? '#4CAF50' : '#FF9800' },
                ]}
                textStyle={{ color: isShiftOpen ? '#4CAF50' : '#FF9800' }}
              >
                {isShiftOpen ? 'ABIERTO' : 'CERRADO'}
              </Chip>
            </View>

            <Divider style={styles.divider} />

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

                      {shift.expectedCash !== null && (
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
                    <Text variant="bodyMedium" style={styles.closedText}>
                      {canOpenShift
                        ? 'El turno está cerrado. Para comenzar las operaciones, abre el turno.'
                        : 'El turno está cerrado. Contacta a un administrador para abrirlo.'}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Button
                mode="text"
                onPress={onDismiss}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonText}
              >
                Cerrar
              </Button>

              {!isShiftOpen && canOpenShift && (
                <Button
                  mode="contained"
                  onPress={handleOpenShift}
                  style={styles.actionButton}
                  contentStyle={styles.actionButtonContent}
                  labelStyle={styles.actionButtonText}
                  icon="play-circle"
                >
                  Abrir Turno
                </Button>
              )}

              {isShiftOpen && canOpenShift && onCloseShift && (
                <Button
                  mode="contained"
                  onPress={() => {
                    onDismiss();
                    onCloseShift();
                  }}
                  style={styles.closeShiftButton}
                  contentStyle={styles.actionButtonContent}
                  labelStyle={styles.closeShiftButtonText}
                  icon="stop-circle"
                >
                  Cerrar Turno
                </Button>
              )}
            </View>
          </Surface>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.m,
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 3,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 8,
      },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    header: {
      alignItems: 'center',
      paddingTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.l,
      borderTopLeftRadius: theme.roundness * 3,
      borderTopRightRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surfaceVariant,
    },
    iconContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
      borderWidth: 3,
      borderColor: theme.colors.primary,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    title: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    date: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      textTransform: 'capitalize',
      marginBottom: theme.spacing.m,
    },
    statusChip: {
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      height: 1,
    },
    content: {
      padding: theme.spacing.l,
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
      marginTop: theme.spacing.m,
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    },
    notes: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      fontStyle: 'italic',
    },
    closedInfo: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.m,
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: theme.spacing.s,
    },
    closedText: {
      flex: 1,
      color: theme.colors.onPrimaryContainer,
      lineHeight: 20,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: theme.spacing.l,
      paddingTop: theme.spacing.s,
      gap: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      borderBottomLeftRadius: theme.roundness * 3,
      borderBottomRightRadius: theme.roundness * 3,
    },
    cancelButton: {
      flex: 1,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 2,
    },
    cancelButtonText: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    actionButton: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: theme.roundness * 2,
    },
    actionButtonContent: {
      paddingVertical: theme.spacing.xs,
    },
    actionButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
    closeShiftButton: {
      flex: 1,
      backgroundColor: '#FF5722',
      borderWidth: 2,
      borderColor: '#FF5722',
      borderRadius: theme.roundness * 2,
    },
    closeShiftButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });
