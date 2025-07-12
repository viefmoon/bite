import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView,
  Platform
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

interface CloseShiftModalProps {
  visible: boolean;
  onDismiss: () => void;
  onShiftClosed: () => void;
  shift: Shift | null;
}

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  visible,
  onDismiss,
  onShiftClosed,
  shift,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  
  const [finalCash, setFinalCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFinalCashChange = (text: string) => {
    // Permitir solo números y un punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevenir múltiples puntos decimales
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    
    // Limitar a 2 decimales
    if (parts[1] && parts[1].length > 2) {
      setFinalCash(parts[0] + '.' + parts[1].substring(0, 2));
    } else {
      setFinalCash(cleaned);
    }
  };

  const handleCloseShift = async () => {
    if (!finalCash) {
      setError('El efectivo final es requerido');
      return;
    }

    const cashAmount = parseFloat(finalCash);
    if (isNaN(cashAmount) || cashAmount < 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await shiftsService.closeShift({
        finalCash: cashAmount,
        closeNotes: closeNotes || undefined,
      });

      showSnackbar({ message: 'Turno cerrado exitosamente', type: 'success' });
      setFinalCash('');
      setCloseNotes('');
      onShiftClosed();
      onDismiss();
    } catch (error: any) {
      let errorMessage = 'Error al cerrar el turno';
      
      if (error?.message) {
        errorMessage = error.message;
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
      setFinalCash('');
      setCloseNotes('');
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
    if (!finalCash || !shift?.expectedCash) return null;
    const cash = parseFloat(finalCash);
    if (isNaN(cash)) return null;
    return cash - shift.expectedCash;
  };

  const difference = calculateDifference();
  const today = new Date();
  const todayFormatted = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

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
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Surface style={styles.modal} elevation={3}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons
                    name="store-off"
                    size={48}
                    color="#FF5722"
                  />
                </View>
                <Text variant="headlineMedium" style={styles.title}>
                  Cierre de Turno
                </Text>
                <Text variant="bodyLarge" style={styles.date}>
                  {todayFormatted}
                </Text>
              </View>

              <Divider style={styles.divider} />

              {/* Resumen del día */}
              {shift && (
                <View style={styles.content}>
                  <Card style={styles.summaryCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        Resumen del Turno #{shift.globalShiftNumber}
                      </Text>
                      
                      <View style={styles.summaryRow}>
                        <Text variant="bodyMedium" style={styles.label}>Abierto a las:</Text>
                        <Text variant="bodyMedium" style={styles.value}>{formatTime(shift.openedAt)}</Text>
                      </View>
                      
                      <View style={styles.summaryRow}>
                        <Text variant="bodyMedium" style={styles.label}>Efectivo inicial:</Text>
                        <Text variant="bodyMedium" style={styles.value}>{formatCurrency(shift.initialCash)}</Text>
                      </View>

                      {shift.totalSales !== null && (
                        <View style={styles.summaryRow}>
                          <Text variant="bodyMedium" style={styles.label}>Ventas del día:</Text>
                          <Text variant="bodyMedium" style={[styles.value, styles.highlight]}>{formatCurrency(shift.totalSales)}</Text>
                        </View>
                      )}

                      {shift.expectedCash !== null && (
                        <View style={styles.summaryRow}>
                          <Text variant="bodyMedium" style={styles.label}>Efectivo esperado:</Text>
                          <Text variant="bodyMedium" style={[styles.value, styles.highlight]}>{formatCurrency(shift.expectedCash)}</Text>
                        </View>
                      )}
                    </Card.Content>
                  </Card>

                  {/* Formulario de cierre */}
                  <View style={styles.inputSection}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Información de Cierre
                    </Text>
                    
                    <TextInput
                      label="Efectivo final en caja"
                      value={finalCash}
                      onChangeText={handleFinalCashChange}
                      keyboardType="decimal-pad"
                      mode="outlined"
                      left={<TextInput.Affix text="$" />}
                      style={styles.input}
                      disabled={loading}
                      error={!!error}
                      placeholder="0.00"
                      outlineColor={error ? theme.colors.error : theme.colors.outline}
                      activeOutlineColor={error ? theme.colors.error : theme.colors.primary}
                    />

                    {difference !== null && (
                      <View style={[styles.differenceContainer, difference < 0 ? styles.negativeDifference : styles.positiveDifference]}>
                        <MaterialCommunityIcons
                          name={difference >= 0 ? "trending-up" : "trending-down"}
                          size={20}
                          color={difference >= 0 ? "#4CAF50" : "#FF5722"}
                        />
                        <Text style={[styles.differenceText, { color: difference >= 0 ? "#4CAF50" : "#FF5722" }]}>
                          {difference >= 0 ? "Sobrante: " : "Faltante: "}
                          {formatCurrency(Math.abs(difference))}
                        </Text>
                      </View>
                    )}

                    <HelperText type="error" visible={!!error} style={styles.errorText}>
                      {error}
                    </HelperText>

                    <SpeechRecognitionInput
                      key="close-notes-input"
                      label="Notas de cierre (opcional)"
                      value={closeNotes}
                      onChangeText={setCloseNotes}
                      multiline
                      speechLang="es-MX"
                      placeholder="Ej: Observaciones del turno, incidencias..."
                      autoCapitalize="sentences"
                      autoCorrect={false}
                      disabled={loading}
                    />
                  </View>
                </View>
              )}

              {/* Footer */}
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
                  onPress={handleCloseShift}
                  style={[styles.button, styles.confirmButton]}
                  contentStyle={styles.confirmButtonContent}
                  labelStyle={styles.confirmButtonText}
                  loading={loading}
                  disabled={loading}
                  icon="stop-circle"
                >
                  Cerrar Turno
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
      color: theme.colors.onSurfaceVariant,
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
      backgroundColor: '#FF5722',
      borderWidth: 2,
      borderColor: '#FF5722',
      borderRadius: theme.roundness * 2,
    },
    confirmButtonContent: {
      paddingVertical: theme.spacing.xs,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
  });