import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  RadioButton,
  HelperText,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  PaymentMethodEnum,
  type PaymentMethod,
} from '../schema/payment.schema';
import { formatPaymentMethod } from '../utils/formatters';
import { DISABLED_PAYMENT_METHODS } from '@/app/constants/ui';

interface NewPaymentFormProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  amount: number | null;
  onAmountChange: (amount: number | null) => void;
  pendingAmount: number;
  mode?: 'payment' | 'prepayment';
  isLoading?: boolean;
}

export const NewPaymentForm: React.FC<NewPaymentFormProps> = ({
  selectedMethod,
  onMethodChange,
  amount,
  onAmountChange,
  pendingAmount,
  mode = 'payment',
  isLoading = false,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );
  const amountInputRef = useRef<View>(null);

  const isValidAmount = amount !== null && amount > 0;

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>
        {mode === 'prepayment' ? 'Configurar pago' : 'Registrar nuevo pago'}
      </Text>

      {/* Métodos de pago */}
      <View style={styles.methodsContainer}>
        {Object.entries(PaymentMethodEnum).map(([key, value]) => {
          const isDisabled = DISABLED_PAYMENT_METHODS.includes(
            value as PaymentMethod,
          );
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.methodCard,
                selectedMethod === value && styles.methodCardSelected,
                isDisabled && styles.methodCardDisabled,
              ]}
              onPress={() => !isDisabled && onMethodChange(value)}
              disabled={isDisabled}
            >
              <RadioButton
                value={value}
                status={selectedMethod === value ? 'checked' : 'unchecked'}
                onPress={() => !isDisabled && onMethodChange(value)}
                disabled={isDisabled}
              />
              <View style={styles.methodLabelContainer}>
                <Text
                  style={[
                    styles.methodText,
                    selectedMethod === value && styles.methodTextSelected,
                    isDisabled && styles.methodTextDisabled,
                  ]}
                >
                  {formatPaymentMethod(value)}
                </Text>
                {isDisabled && (
                  <Text style={styles.comingSoonText}>Próximamente</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Campo de monto */}
      <View style={styles.amountContainer} ref={amountInputRef}>
        <View style={styles.amountRow}>
          <TextInput
            label="Monto a pagar"
            value={amount?.toString() || ''}
            onChangeText={(text) => {
              const numValue = parseFloat(text);
              onAmountChange(isNaN(numValue) ? null : numValue);
            }}
            keyboardType="decimal-pad"
            mode="outlined"
            left={<TextInput.Affix text="$" />}
            style={styles.amountInput}
            error={!isValidAmount && amount !== null}
            disabled={isLoading}
          />
          <Button
            mode="outlined"
            onPress={() => onAmountChange(pendingAmount)}
            style={styles.totalPendingButton}
            labelStyle={styles.totalPendingButtonLabel}
            contentStyle={styles.totalPendingButtonContent}
            compact
            disabled={isLoading}
          >
            Total a pagar
          </Button>
        </View>
        <HelperText type="error" visible={!isValidAmount && amount !== null}>
          Ingrese un monto válido
        </HelperText>
      </View>
    </View>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    formSection: {
      paddingHorizontal: responsive.spacingPreset.m,
      paddingBottom: responsive.spacingPreset.xs,
    },
    sectionTitle: {
      ...theme.fonts.titleSmall,
      fontSize: responsive.fontSize(theme.fonts.titleSmall.fontSize),
      color: theme.colors.onSurface,
      marginBottom: responsive.spacingPreset.xs,
      fontWeight: '600',
    },
    methodsContainer: {
      marginBottom: responsive.spacingPreset.s,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: responsive.spacingPreset.xs,
      paddingHorizontal: responsive.spacingPreset.s,
      marginBottom: responsive.spacingPreset.xs,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    methodCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    methodText: {
      ...theme.fonts.bodyLarge,
      fontSize: responsive.fontSize(theme.fonts.bodyLarge.fontSize),
      color: theme.colors.onSurface,
      marginLeft: responsive.spacingPreset.xs,
    },
    methodTextSelected: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '500',
    },
    methodCardDisabled: {
      opacity: 0.5,
      borderColor: theme.colors.outlineVariant,
    },
    methodLabelContainer: {
      flex: 1,
      marginLeft: responsive.spacingPreset.xs,
    },
    methodTextDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    comingSoonText: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.fontSize(theme.fonts.bodySmall.fontSize),
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
    amountContainer: {
      marginTop: responsive.spacingPreset.s,
    },
    amountRow: {
      flexDirection: 'row',
      gap: responsive.spacingPreset.xs,
      alignItems: 'flex-start',
    },
    amountInput: {
      backgroundColor: theme.colors.surface,
      flex: 1,
    },
    totalPendingButton: {
      marginTop: 4, // Alinear con el input que tiene un label
      height: responsive.isTablet ? 48 : 56, // Misma altura que el TextInput con outlined
      borderColor: theme.colors.primary,
      justifyContent: 'center',
    },
    totalPendingButtonContent: {
      height: '100%',
      paddingVertical: 0,
      paddingHorizontal: responsive.spacingPreset.s,
    },
    totalPendingButtonLabel: {
      fontSize: responsive.fontSize(13),
      lineHeight: responsive.isTablet ? 18 : 20,
      textAlignVertical: 'center',
    },
  });
