import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  HelperText,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';

interface ChangeCalculatorModalProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
  amountToPay: number;
}

export const ChangeCalculatorModal: React.FC<ChangeCalculatorModalProps> = ({
  visible,
  onDismiss,
  onConfirm,
  amountToPay,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [receivedAmount, setReceivedAmount] = useState('');

  // Calcular cambio
  const changeAmount = useMemo(() => {
    const received = parseFloat(receivedAmount);
    if (isNaN(received)) return 0;
    return Math.max(0, received - amountToPay);
  }, [receivedAmount, amountToPay]);

  // Determinar qué botones de billetes mostrar
  const availableBills = useMemo(() => {
    const bills = [50, 100, 200, 500, 1000];
    // Filtrar billetes que sean mayores o iguales al monto a pagar
    const validBills = bills.filter((bill) => bill >= amountToPay);
    // Tomar máximo 4 opciones para que quepan en una línea
    return validBills.slice(0, 4);
  }, [amountToPay]);

  // Resetear cuando se abre
  useEffect(() => {
    if (visible) {
      setReceivedAmount(amountToPay.toFixed(2));
    }
  }, [visible, amountToPay]);

  const handleConfirm = () => {
    const received = parseFloat(receivedAmount);
    if (!isNaN(received) && received >= amountToPay) {
      onConfirm();
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Pressable style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Cálculo de Cambio</Text>
            <IconButton
              icon="close"
              size={20}
              onPress={onDismiss}
              iconColor={theme.colors.onSurfaceVariant}
              style={styles.closeButton}
            />
          </View>

          <View style={styles.content}>
            {/* Monto a pagar */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalAmount}>${amountToPay.toFixed(2)}</Text>
            </View>

            {/* Monto recibido */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Monto recibido</Text>
              <TextInput
                value={receivedAmount}
                onChangeText={setReceivedAmount}
                keyboardType="decimal-pad"
                mode="flat"
                left={<TextInput.Affix text="$" />}
                style={styles.receivedAmountInput}
                error={
                  receivedAmount !== '' &&
                  (isNaN(parseFloat(receivedAmount)) ||
                    parseFloat(receivedAmount) < amountToPay)
                }
                autoFocus
                dense
                theme={{
                  colors: {
                    primary: theme.colors.primary,
                    background: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              />

              {/* Botones de billetes comunes */}
              {availableBills.length > 0 && (
                <View style={styles.quickAmountsRow}>
                  {availableBills.map((bill) => (
                    <Pressable
                      key={bill}
                      onPress={() => setReceivedAmount(`${bill}.00`)}
                      style={({ pressed }) => [
                        styles.quickAmountButton,
                        pressed && styles.quickAmountButtonPressed,
                      ]}
                    >
                      <Text style={styles.quickAmountButtonText}>
                        ${bill >= 1000 ? '1k' : bill}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Error message */}
            {receivedAmount !== '' &&
              (isNaN(parseFloat(receivedAmount)) ||
                parseFloat(receivedAmount) < amountToPay) && (
                <Text style={styles.errorText}>Monto insuficiente</Text>
              )}

            {/* Mostrar cambio */}
            {receivedAmount !== '' &&
              !isNaN(parseFloat(receivedAmount)) &&
              parseFloat(receivedAmount) >= amountToPay && (
                <View style={styles.changeSection}>
                  <Text style={styles.changeLabel}>Cambio</Text>
                  <Text style={styles.changeAmount}>
                    ${changeAmount.toFixed(2)}
                  </Text>
                </View>
              )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.cancelButton}
              labelStyle={styles.cancelButtonLabel}
              contentStyle={styles.footerButtonContent}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleConfirm}
              disabled={
                !receivedAmount ||
                isNaN(parseFloat(receivedAmount)) ||
                parseFloat(receivedAmount) < amountToPay
              }
              style={styles.confirmButton}
              contentStyle={styles.footerButtonContent}
              labelStyle={styles.confirmButtonLabel}
            >
              Confirmar Pago
            </Button>
          </View>
        </Pressable>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
    },
    modalContent: {
      borderRadius: 20,
      backgroundColor: theme.dark ? '#1C1C1E' : '#FFFFFF',
      width: '100%',
      maxWidth: 340,
      overflow: 'hidden',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
    },
    title: {
      ...theme.fonts.titleMedium,
      color: theme.dark ? '#FFFFFF' : '#000000',
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    closeButton: {
      margin: -8,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 16,
    },
    totalSection: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      padding: 12,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 16,
    },
    totalLabel: {
      ...theme.fonts.bodySmall,
      color: theme.dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: 2,
    },
    totalAmount: {
      ...theme.fonts.titleMedium,
      color: theme.dark ? '#FFFFFF' : '#000000',
      fontWeight: '600',
      letterSpacing: -0.3,
    },
    inputSection: {
      marginBottom: 12,
    },
    inputLabel: {
      ...theme.fonts.bodySmall,
      color: theme.dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: 6,
    },
    receivedAmountInput: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 10,
      fontSize: 18,
      height: 44,
      paddingHorizontal: 12,
    },
    quickAmountsRow: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 8,
      justifyContent: 'center',
    },
    quickAmountButton: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 70,
      alignItems: 'center',
    },
    quickAmountButtonPressed: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.2)'
        : 'rgba(0, 0, 0, 0.1)',
    },
    quickAmountButtonText: {
      ...theme.fonts.labelMedium,
      color: theme.dark ? '#FFFFFF' : '#000000',
      fontWeight: '600',
    },
    errorText: {
      ...theme.fonts.bodySmall,
      color: '#FF4444',
      marginTop: 4,
      marginLeft: 2,
    },
    changeSection: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      padding: 12,
      borderRadius: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 8,
    },
    changeLabel: {
      ...theme.fonts.bodySmall,
      color: theme.dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      fontWeight: '500',
    },
    changeAmount: {
      ...theme.fonts.titleMedium,
      color: '#10B981',
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
    },
    cancelButton: {
      flex: 1,
      marginRight: 8,
      borderColor: '#DC2626',
      borderWidth: 1,
    },
    cancelButtonLabel: {
      color: '#DC2626',
      fontWeight: '500',
    },
    confirmButton: {
      flex: 2,
      marginLeft: 8,
      backgroundColor: '#10B981',
      borderRadius: 12,
    },
    confirmButtonLabel: {
      color: '#FFFFFF',
      fontWeight: '600',
    },
    footerButtonContent: {
      height: 40,
    },
  });

export default ChangeCalculatorModal;
