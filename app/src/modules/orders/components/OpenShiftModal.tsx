import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput as RNTextInput,
  Platform,
  KeyboardAvoidingView,
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
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { shiftsService } from '@/services/shifts';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SpeechRecognitionInput from '@/app/components/common/SpeechRecognitionInput';

interface OpenShiftModalProps {
  visible: boolean;
  onDismiss: () => void;
  onShiftOpened: () => void;
}

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  visible,
  onDismiss,
  onShiftOpened,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const [initialCash, setInitialCash] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInitialCashChange = (text: string) => {
    // Permitir solo números y un punto decimal
    const cleaned = text.replace(/[^0-9.]/g, '');

    // Prevenir múltiples puntos decimales
    const parts = cleaned.split('.');
    if (parts.length > 2) return;

    // Limitar a 2 decimales
    if (parts[1] && parts[1].length > 2) {
      setInitialCash(parts[0] + '.' + parts[1].substring(0, 2));
    } else {
      setInitialCash(cleaned);
    }
  };

  const handleOpenShift = async () => {
    if (!initialCash) {
      setError('El monto inicial es requerido');
      return;
    }

    const cashAmount = parseFloat(initialCash);
    if (isNaN(cashAmount) || cashAmount < 0) {
      setError('Ingresa un monto válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await shiftsService.openShift({
        initialCash: cashAmount,
        notes: notes || undefined,
      });

      showSnackbar({ message: 'Turno abierto exitosamente', type: 'success' });
      setInitialCash('');
      setNotes('');
      onShiftOpened();
      onDismiss();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Error al abrir el turno';
      setError(errorMessage);
      showSnackbar({ message: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      setInitialCash('');
      setNotes('');
      setError('');
      onDismiss();
    }
  };

  const today = new Date();
  const todayFormatted = format(today, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

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
                    name="store-check"
                    size={48}
                    color={theme.colors.primary}
                  />
                </View>
                <Text variant="headlineMedium" style={styles.title}>
                  Apertura de Turno
                </Text>
                <Text variant="bodyLarge" style={styles.date}>
                  {todayFormatted}
                </Text>
              </View>

              <Divider style={styles.divider} />

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.infoCard}>
                  <MaterialCommunityIcons
                    name="information"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text variant="bodyMedium" style={styles.infoText}>
                    Registra el monto inicial para comenzar las operaciones del
                    turno.
                  </Text>
                </View>

                <View style={styles.inputSection}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Información de Apertura
                  </Text>

                  <TextInput
                    label="Monto inicial en caja"
                    value={initialCash}
                    onChangeText={handleInitialCashChange}
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

                  <HelperText
                    type="error"
                    visible={!!error}
                    style={styles.errorText}
                  >
                    {error}
                  </HelperText>

                  <SpeechRecognitionInput
                    key="notes-input-shift"
                    label="Notas adicionales (opcional)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    speechLang="es-MX"
                    placeholder="Ej: Estado de la caja, observaciones..."
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    disabled={loading}
                  />
                </View>
              </View>

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
                  onPress={handleOpenShift}
                  style={[styles.button, styles.confirmButton]}
                  contentStyle={styles.confirmButtonContent}
                  labelStyle={styles.confirmButtonText}
                  loading={loading}
                  disabled={loading}
                  icon="play-circle"
                >
                  Abrir Turno
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
    },
    modal: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      marginHorizontal: theme.spacing.m,
    },
    header: {
      alignItems: 'center',
      paddingTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.l,
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
    inputSection: {
      marginTop: theme.spacing.s,
    },
    sectionTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
      marginBottom: theme.spacing.m,
    },
    input: {
      backgroundColor: theme.colors.surface,
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
    },
    button: {
      flex: 1,
    },
    cancelButton: {
      borderColor: theme.colors.outline,
      borderWidth: 1,
    },
    cancelButtonText: {
      color: theme.colors.onSurfaceVariant,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      elevation: 0,
    },
    confirmButtonContent: {
      paddingVertical: theme.spacing.xs,
    },
    confirmButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
  });
