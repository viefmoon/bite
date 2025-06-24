import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
Modal,
  Portal,
Text,
  Button,
  TextInput,
  Surface,
  IconButton,} from 'react-native-paper';
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
          <View style={styles.content}>
            {/* Inputs en línea */}
            <View style={styles.inputsRow}>
              {/* Total a pagar */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Total a pagar</Text>
                <TextInput
                  value={`$${amountToPay.toFixed(2)}`}
                  editable={false}
                  mode="flat"
                  style={styles.totalInput}
                  dense
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: 'rgba(255, 255, 255, 0.05)',
                      text: theme.dark ? '#FFFFFF' : '#000000',
                    },
                  }}
                />
              </View>

              {/* Monto recibido */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Monto recibido</Text>
                <TextInput
                  value={receivedAmount}
                  onChangeText={setReceivedAmount}
                  keyboardType="decimal-pad"
                  mode="flat"
                  left={<TextInput.Affix text="$" />}
                  style={styles.receivedInput}
                  error={
                    receivedAmount !== '' &&
                    (isNaN(parseFloat(receivedAmount)) ||
                      parseFloat(receivedAmount) < amountToPay)
                  }
                  dense
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      background: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />
              </View>
            </View>

            {/* Error message */}
            {receivedAmount !== '' &&
              (isNaN(parseFloat(receivedAmount)) ||
                parseFloat(receivedAmount) < amountToPay) && (
                <Text style={styles.errorText}>Monto insuficiente</Text>
              )}

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
      borderRadius: 16,
      backgroundColor: theme.dark ? '#1C1C1E' : '#FFFFFF',
      width: '100%',
      maxWidth: 320,
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
    content: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },
    inputsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 12,
    },
    inputContainer: {
      flex: 1,
    },
    inputLabel: {
      ...theme.fonts.bodySmall,
      color: theme.dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: 4,
      fontSize: 11,
    },
    totalInput: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 8,
      fontSize: 16,
      height: 40,
      paddingHorizontal: 10,
      opacity: 0.8,
    },
    receivedInput: {
      backgroundColor: theme.dark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 8,
      fontSize: 16,
      height: 40,
      paddingHorizontal: 10,
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
      paddingVertical: 10,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
      minHeight: 42,
      justifyContent: 'center',
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
      fontSize: 14,
    },
    errorText: {
      ...theme.fonts.bodySmall,
      color: '#FF4444',
      marginTop: 2,
      marginLeft: 2,
      fontSize: 11,
    },
    changeSection: {
      backgroundColor: theme.dark
        ? 'rgba(16, 185, 129, 0.1)'
        : 'rgba(16, 185, 129, 0.08)',
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8,
    },
    changeLabel: {
      ...theme.fonts.bodySmall,
      color: theme.dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      marginBottom: 2,
      fontSize: 12,
    },
    changeAmount: {
      ...theme.fonts.titleLarge,
      color: '#10B981',
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.dark
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(0, 0, 0, 0.05)',
      backgroundColor: theme.dark ? '#1C1C1E' : '#FFFFFF',
    },
    cancelButton: {
      flex: 1,
      borderColor: theme.colors.outline,
    },
    cancelButtonLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    confirmButton: {
      flex: 2,
      backgroundColor: '#10B981',
    },
    confirmButtonLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    footerButtonContent: {
      height: 36,
    },
  });

export default ChangeCalculatorModal;
