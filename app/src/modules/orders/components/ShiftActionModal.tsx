import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  HelperText,
  Surface,
  Divider,
  Card,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { shiftsService, type Shift } from '@/services/shifts';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';

type ShiftActionMode = 'open' | 'close';

interface ShiftActionModalProps {
  visible: boolean;
  onDismiss: () => void;
  mode: ShiftActionMode;
  shift?: Shift | null;
  onShiftOpened?: () => void;
  onShiftClosed?: () => void;
}

export const ShiftActionModal: React.FC<ShiftActionModalProps> = ({
  visible,
  onDismiss,
  mode,
  shift,
  onShiftOpened,
  onShiftClosed,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isOpenMode = mode === 'open';

  const handleCashAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;

    if (parts[1] && parts[1].length > 2) {
      setCashAmount(parts[0] + '.' + parts[1].substring(0, 2));
    } else {
      setCashAmount(cleaned);
    }
  };

  const handleSubmit = async () => {
    if (!cashAmount) {
      setError(
        isOpenMode
          ? 'El monto inicial es requerido'
          : 'El efectivo final es requerido',
      );
      return;
    }

    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isOpenMode) {
        await shiftsService.openShift({
          initialCash: amount,
          notes: notes || undefined,
        });
        showSnackbar({
          message: 'Turno abierto exitosamente',
          type: 'success',
        });
        onShiftOpened?.();
      } else {
        await shiftsService.closeShift({
          finalCash: amount,
          closeNotes: notes || undefined,
        });
        showSnackbar({
          message: 'Turno cerrado exitosamente',
          type: 'success',
        });
        onShiftClosed?.();
      }

      setCashAmount('');
      setNotes('');
      onDismiss();
    } catch (error: any) {
      let errorMessage = isOpenMode
        ? 'Error al abrir el turno'
        : 'Error al cerrar el turno';

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      setError(errorMessage);
      showSnackbar({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      setCashAmount('');
      setNotes('');
      setError('');
      onDismiss();
    }
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

  const calculateDifference = () => {
    if (isOpenMode || !cashAmount || !shift?.expectedCash) return null;
    const cash = parseFloat(cashAmount);
    if (isNaN(cash)) return null;
    return cash - shift.expectedCash;
  };

  const difference = calculateDifference();
  const today = new Date();
  const todayFormatted = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const config = {
    open: {
      title: 'Apertura de Turno',
      icon: 'store-check',
      iconColor: theme.colors.primary,
      buttonText: 'Abrir Turno',
      buttonIcon: 'play-circle',
      buttonColor: theme.colors.primary,
      cashLabel: 'Monto inicial en caja',
      notesLabel: 'Notas adicionales (opcional)',
      notesPlaceholder: 'Ej: Estado de la caja, observaciones...',
      infoText:
        'Registra el monto inicial para comenzar las operaciones del turno.',
    },
    close: {
      title: 'Cierre de Turno',
      icon: 'store-off',
      iconColor: '#FF5722',
      buttonText: 'Cerrar Turno',
      buttonIcon: 'stop-circle',
      buttonColor: '#FF5722',
      cashLabel: 'Efectivo final en caja',
      notesLabel: 'Notas de cierre (opcional)',
      notesPlaceholder: 'Ej: Observaciones del turno, incidencias...',
    },
  }[mode];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
        dismissable={!loading}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Surface style={styles.modal} elevation={3}>
              <View style={[styles.header, !isOpenMode && styles.closeHeader]}>
                <View
                  style={[
                    styles.iconContainer,
                    !isOpenMode && styles.closeIconContainer,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={config.icon as any}
                    size={48}
                    color={config.iconColor}
                  />
                </View>
                <Text variant="headlineMedium" style={styles.title}>
                  {config.title}
                </Text>
                <Text variant="bodyLarge" style={styles.date}>
                  {todayFormatted}
                </Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.content}>
                {isOpenMode && (
                  <View style={styles.infoCard}>
                    <MaterialCommunityIcons
                      name="information"
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text variant="bodyMedium" style={styles.infoText}>
                      {config.infoText}
                    </Text>
                  </View>
                )}

                {!isOpenMode && shift && (
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

                      {shift.totalSales !== null && (
                        <View style={styles.summaryRow}>
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

                      {shift.expectedCash !== null && (
                        <View style={styles.summaryRow}>
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
                    </Card.Content>
                  </Card>
                )}

                <View style={styles.inputSection}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    {isOpenMode
                      ? 'Información de Apertura'
                      : 'Información de Cierre'}
                  </Text>

                  <TextInput
                    label={config.cashLabel}
                    value={cashAmount}
                    onChangeText={handleCashAmountChange}
                    keyboardType="decimal-pad"
                    mode="outlined"
                    left={<TextInput.Affix text="$" />}
                    style={styles.input}
                    disabled={loading}
                    error={!!error}
                    placeholder="0.00"
                    outlineColor={
                      error ? theme.colors.error : theme.colors.outline
                    }
                    activeOutlineColor={
                      error ? theme.colors.error : theme.colors.primary
                    }
                  />

                  {!isOpenMode && difference !== null && (
                    <View
                      style={[
                        styles.differenceContainer,
                        difference < 0
                          ? styles.negativeDifference
                          : styles.positiveDifference,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={difference >= 0 ? 'trending-up' : 'trending-down'}
                        size={20}
                        color={difference >= 0 ? '#4CAF50' : '#FF5722'}
                      />
                      <Text
                        style={[
                          styles.differenceText,
                          difference >= 0
                            ? styles.positiveText
                            : styles.negativeText,
                        ]}
                      >
                        {difference >= 0 ? 'Sobrante: ' : 'Faltante: '}
                        {formatCurrency(Math.abs(difference))}
                      </Text>
                    </View>
                  )}

                  <HelperText
                    type="error"
                    visible={!!error}
                    style={styles.errorText}
                  >
                    {error}
                  </HelperText>

                  <SpeechRecognitionInput
                    key={`${mode}-notes-input`}
                    label={config.notesLabel}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    speechLang="es-MX"
                    placeholder={config.notesPlaceholder}
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    disabled={loading}
                  />
                </View>
              </View>

              <View style={styles.footer}>
                <Button
                  mode="text"
                  onPress={handleDismiss}
                  style={[styles.button, styles.cancelButton]}
                  labelStyle={styles.cancelButtonText}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  style={[
                    styles.button,
                    styles.confirmButton,
                    !isOpenMode && styles.closeConfirmButton,
                  ]}
                  contentStyle={styles.confirmButtonContent}
                  labelStyle={[
                    styles.confirmButtonText,
                    !isOpenMode && styles.closeConfirmButtonText,
                  ]}
                  loading={loading}
                  disabled={loading}
                  icon={config.buttonIcon}
                >
                  {config.buttonText}
                </Button>
              </View>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
    },
    scrollViewContent: {
      flexGrow: 1,
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
    },
    closeHeader: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    closeIconContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: theme.colors.surface,
      borderWidth: 3,
      borderColor: '#FF5722',
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
      color: theme.colors.onSurface,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    date: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      textTransform: 'capitalize',
    },
    divider: {
      backgroundColor: theme.colors.outlineVariant,
      height: 1,
    },
    content: {
      padding: theme.spacing.l,
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.l,
      gap: theme.spacing.s,
    },
    infoText: {
      flex: 1,
      color: theme.colors.onPrimaryContainer,
      lineHeight: 20,
    },
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
    inputSection: {
      marginTop: theme.spacing.s,
    },
    input: {
      backgroundColor: theme.colors.surface,
      marginBottom: theme.spacing.s,
    },
    differenceContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.s,
      gap: theme.spacing.s,
    },
    positiveDifference: {
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      borderWidth: 1,
      borderColor: '#4CAF50',
    },
    negativeDifference: {
      backgroundColor: 'rgba(255, 87, 34, 0.1)',
      borderWidth: 1,
      borderColor: '#FF5722',
    },
    differenceText: {
      fontWeight: '600',
    },
    errorText: {
      marginTop: -theme.spacing.xs,
      marginBottom: theme.spacing.s,
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
    button: {
      flex: 1,
    },
    cancelButton: {
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 2,
    },
    cancelButtonText: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      borderRadius: theme.roundness * 2,
    },
    closeConfirmButton: {
      backgroundColor: '#FF5722',
      borderColor: '#FF5722',
    },
    confirmButtonContent: {
      paddingVertical: theme.spacing.xs,
    },
    confirmButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
    closeConfirmButtonText: {
      color: '#FFFFFF',
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    positiveText: {
      color: '#4CAF50',
    },
    negativeText: {
      color: '#FF5722',
    },
  });
