import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  HelperText,
  Divider,
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
    const validBills = bills.filter(bill => bill >= amountToPay);
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
        <Surface style={styles.modalContent} elevation={5}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Cálculo de Cambio</Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
            />
          </View>
          
          <Divider />
          
          <View style={styles.content}>
            {/* Monto a pagar */}
            <View style={styles.amountToPayContainer}>
              <Text style={styles.amountToPayLabel}>Total a pagar:</Text>
              <Text style={styles.amountToPayValue}>${amountToPay.toFixed(2)}</Text>
            </View>
            
            {/* Botones de billetes comunes - solo mostrar opciones válidas */}
            {availableBills.length > 0 && (
              <View style={styles.quickAmountsRow}>
                {availableBills.map((bill) => (
                  <Button
                    key={bill}
                    mode="outlined"
                    onPress={() => setReceivedAmount(`${bill}.00`)}
                    style={styles.quickAmountButton}
                    labelStyle={styles.quickAmountButtonLabel}
                    contentStyle={styles.quickAmountButtonContent}
                  >
                    ${bill >= 1000 ? '1k' : bill}
                  </Button>
                ))}
              </View>
            )}
            
            {/* Monto recibido */}
            <TextInput
              label="Monto recibido"
              value={receivedAmount}
              onChangeText={setReceivedAmount}
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Affix text="$" />}
              style={styles.receivedAmountInput}
              error={receivedAmount !== '' && (isNaN(parseFloat(receivedAmount)) || parseFloat(receivedAmount) < amountToPay)}
              autoFocus
              dense
            />
            
            <HelperText type="error" visible={receivedAmount !== '' && (isNaN(parseFloat(receivedAmount)) || parseFloat(receivedAmount) < amountToPay)}>
              Monto insuficiente
            </HelperText>
            
            {/* Mostrar cambio */}
            {receivedAmount !== '' && !isNaN(parseFloat(receivedAmount)) && parseFloat(receivedAmount) >= amountToPay && (
              <View style={styles.changeDisplayContainer}>
                <Text style={styles.changeLabel}>Cambio:</Text>
                <Text style={styles.changeAmount}>${changeAmount.toFixed(2)}</Text>
              </View>
            )}
          </View>
          
          {/* Footer */}
          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={[styles.footerButton, styles.cancelButton]}
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
              style={styles.footerButton}
              contentStyle={styles.footerButtonContent}
            >
              Confirmar Pago
            </Button>
          </View>
        </Surface>
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
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      width: '100%',
      maxWidth: 380,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
    },
    title: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    content: {
      padding: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
    },
    amountToPayContainer: {
      backgroundColor: theme.colors.secondaryContainer,
      padding: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.roundness,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    amountToPayLabel: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSecondaryContainer,
    },
    amountToPayValue: {
      ...theme.fonts.titleMedium,
      fontWeight: 'bold',
      color: theme.colors.onSecondaryContainer,
    },
    receivedAmountInput: {
      backgroundColor: theme.colors.surface,
      marginBottom: 2,
    },
    changeDisplayContainer: {
      backgroundColor: '#4CAF50',
      padding: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.roundness,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    changeLabel: {
      ...theme.fonts.bodyMedium,
      color: 'white',
      fontWeight: '500',
    },
    changeAmount: {
      ...theme.fonts.titleLarge,
      fontWeight: 'bold',
      color: 'white',
    },
    quickAmountsRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.s,
      justifyContent: 'center',
    },
    quickAmountButton: {
      borderColor: theme.colors.primary,
      flex: 1,
      maxWidth: 85,
    },
    quickAmountButtonLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    quickAmountButtonContent: {
      height: 38,
      paddingHorizontal: theme.spacing.xs,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    footerButton: {
      minWidth: 110,
    },
    footerButtonContent: {
      height: 36,
    },
    cancelButton: {
      borderColor: theme.colors.outline,
    },
  });

export default ChangeCalculatorModal;