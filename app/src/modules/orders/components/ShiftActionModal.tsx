import React from 'react';
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
  Surface,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import type { Shift } from '@/app/schemas/domain/shift.schema';
import { useShiftAction } from '../hooks/useShiftAction';
import { ShiftSummaryCard } from './ShiftSummaryCard';
import { ShiftActionForm } from './ShiftActionForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const {
    // Estado
    cashAmount,
    notes,
    loading,
    error,
    isOpenMode,

    // Funciones
    handleCashAmountChange,
    handleSubmit,
    resetForm,
    calculateDifference,
    formatCurrency,
    formatTime,
    handleNotesChange,
  } = useShiftAction({
    mode,
    shift,
  });

  const handleShiftAction = async () => {
    const success = await handleSubmit();
    if (success) {
      if (isOpenMode) {
        onShiftOpened?.();
      } else {
        onShiftClosed?.();
      }
      onDismiss();
    }
  };

  const handleDismiss = () => {
    if (!loading) {
      resetForm();
      onDismiss();
    }
  };
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
    },
    close: {
      title: 'Cierre de Turno',
      icon: 'store-off',
      iconColor: '#FF5722',
      buttonText: 'Cerrar Turno',
      buttonIcon: 'stop-circle',
      buttonColor: '#FF5722',
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
                {!isOpenMode && shift && (
                  <ShiftSummaryCard
                    shift={shift}
                    formatTime={formatTime}
                    formatCurrency={formatCurrency}
                  />
                )}

                <ShiftActionForm
                  mode={mode}
                  cashAmount={cashAmount}
                  onCashAmountChange={handleCashAmountChange}
                  notes={notes}
                  onNotesChange={handleNotesChange}
                  error={error}
                  loading={loading}
                  shift={shift}
                  calculateDifference={calculateDifference}
                  formatCurrency={formatCurrency}
                />
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
                  onPress={handleShiftAction}
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
