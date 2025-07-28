import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  TextInput,
  HelperText,
  Chip,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import type {
  OrderAdjustment,
  AdjustmentFormData,
} from '../schema/adjustments.schema';

interface AdjustmentFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (adjustment: OrderAdjustment) => void;
  adjustment?: OrderAdjustment | null;
  orderSubtotal: number;
}

export const AdjustmentFormModal: React.FC<AdjustmentFormModalProps> = ({
  visible,
  onDismiss,
  onSave,
  adjustment,
  orderSubtotal,
}) => {
  const theme = useAppTheme();

  // Estado del formulario
  const [formData, setFormData] = useState<AdjustmentFormData>({
    name: '',
    isPercentage: true,
    value: 0,
    amount: 0,
  });

  // Estados separados para los campos de texto
  const [percentageText, setPercentageText] = useState('');
  const [amountText, setAmountText] = useState('');
  const [isDiscount, setIsDiscount] = useState(false);
  const [nameWasEdited, setNameWasEdited] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    value?: string;
    amount?: string;
  }>({});

  // Inicializar formulario cuando se abre o cambia el ajuste
  useEffect(() => {
    if (visible) {
      if (adjustment) {
        setFormData({
          name: adjustment.name,
          isPercentage: adjustment.isPercentage,
          value: adjustment.value || 0,
          amount: adjustment.amount || 0,
        });
        setPercentageText(Math.abs(adjustment.value || 0).toString());
        setAmountText(Math.abs(adjustment.amount || 0).toString());
        setIsDiscount((adjustment.value || adjustment.amount || 0) < 0);
        setNameWasEdited(true); // Si es edición, asumimos que el nombre fue editado
      } else {
        setFormData({
          name: 'Cargo adicional', // Por defecto cargo
          isPercentage: true,
          value: 0,
          amount: 0,
        });
        setPercentageText('');
        setAmountText('');
        setIsDiscount(false);
        setNameWasEdited(false);
      }
      setErrors({});
    }
  }, [visible, adjustment]);

  // Calcular el monto cuando cambia el valor o tipo
  useEffect(() => {
    if (formData.isPercentage && formData.value !== undefined) {
      const calculatedAmount = (orderSubtotal * formData.value) / 100;
      setFormData((prev) => ({ ...prev, amount: calculatedAmount }));
    }
  }, [formData.isPercentage, formData.value, orderSubtotal]);

  const handleTypeChange = (isPercentage: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isPercentage,
      value: isPercentage ? 0 : undefined,
      amount: isPercentage ? 0 : prev.amount,
    }));
    if (isPercentage) {
      setPercentageText('');
    } else {
      setAmountText('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.isPercentage) {
      if (formData.value === undefined || formData.value === null) {
        newErrors.value = 'El porcentaje es requerido';
      } else if (formData.value === 0) {
        newErrors.value = 'El porcentaje no puede ser 0';
      } else if (formData.value < -100 || formData.value > 100) {
        newErrors.value = 'El porcentaje debe estar entre -100 y 100';
      }
    } else {
      if (formData.amount === undefined || formData.amount === null) {
        newErrors.amount = 'El monto es requerido';
      } else if (formData.amount === 0) {
        newErrors.amount = 'El monto no puede ser 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const adjustmentData: OrderAdjustment = {
      id: adjustment?.id || undefined,
      name: formData.name.trim(),
      isPercentage: formData.isPercentage,
      value: formData.isPercentage ? formData.value : undefined,
      amount: formData.amount,
      isNew: !adjustment?.id,
    };

    onSave(adjustmentData);
    onDismiss();
  };

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      maxWidthPercent={85}
      maxHeightPercent={85}
      title={adjustment ? 'Editar Ajuste' : 'Nuevo Ajuste'}
      actions={[
        {
          label: 'Cancelar',
          mode: 'outlined',
          onPress: onDismiss,
          colorPreset: 'secondary'
        },
        {
          label: adjustment ? 'Actualizar' : 'Guardar',
          mode: 'contained',
          onPress: handleSave,
          colorPreset: 'primary'
        }
      ]}
    >
          {/* Nombre del ajuste */}
          <TextInput
            label="Nombre"
            value={formData.name}
            onChangeText={(text) => {
              setFormData((prev) => ({ ...prev, name: text }));
              // Detectar si el usuario editó manualmente el nombre
              setNameWasEdited(
                text !== 'Descuento' && text !== 'Cargo adicional',
              );
            }}
            mode="outlined"
            error={!!errors.name}
            placeholder="Ej: Descuento especial"
            style={styles.input}
          />
          {errors.name && (
            <HelperText type="error" visible={true}>
              {errors.name}
            </HelperText>
          )}

          {/* Tipo de ajuste con chips */}
          <View style={styles.typeContainer}>
            <Text
              variant="labelLarge"
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              Tipo de ajuste
            </Text>
            <View style={styles.chipGroup}>
              <Chip
                mode={formData.isPercentage ? 'flat' : 'outlined'}
                onPress={() => handleTypeChange(true)}
                selected={formData.isPercentage}
                style={[
                  styles.chip,
                  formData.isPercentage && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                textStyle={
                  formData.isPercentage && {
                    color: theme.colors.onPrimaryContainer,
                  }
                }
              >
                Porcentaje
              </Chip>
              <Chip
                mode={!formData.isPercentage ? 'flat' : 'outlined'}
                onPress={() => handleTypeChange(false)}
                selected={!formData.isPercentage}
                style={[
                  styles.chip,
                  !formData.isPercentage && {
                    backgroundColor: theme.colors.primaryContainer,
                  },
                ]}
                textStyle={
                  !formData.isPercentage && {
                    color: theme.colors.onPrimaryContainer,
                  }
                }
              >
                Monto fijo
              </Chip>
            </View>
          </View>

          {/* Tipo de operación (descuento o cargo) */}
          <View style={styles.operationContainer}>
            <Text
              variant="labelLarge"
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              Tipo de operación
            </Text>
            <View style={styles.operationButtons}>
              <Button
                mode={isDiscount ? 'contained' : 'outlined'}
                onPress={() => {
                  setIsDiscount(true);
                  // Siempre actualizar el nombre si no fue editado manualmente
                  if (!nameWasEdited) {
                    setFormData((prev) => ({ ...prev, name: 'Descuento' }));
                  }
                  if (formData.isPercentage) {
                    const absValue = Math.abs(parseFloat(percentageText) || 0);
                    setFormData((prev) => ({ ...prev, value: -absValue }));
                  } else {
                    const absValue = Math.abs(parseFloat(amountText) || 0);
                    setFormData((prev) => ({ ...prev, amount: -absValue }));
                  }
                }}
                style={[
                  styles.operationButton,
                  isDiscount && {
                    backgroundColor: theme.colors.errorContainer,
                    borderColor: theme.colors.error,
                  },
                ]}
                labelStyle={{
                  color: isDiscount
                    ? theme.colors.onErrorContainer
                    : theme.colors.error,
                }}
                icon="minus"
              >
                Descuento
              </Button>
              <Button
                mode={!isDiscount ? 'contained' : 'outlined'}
                onPress={() => {
                  setIsDiscount(false);
                  // Siempre actualizar el nombre si no fue editado manualmente
                  if (!nameWasEdited) {
                    setFormData((prev) => ({
                      ...prev,
                      name: 'Cargo adicional',
                    }));
                  }
                  if (formData.isPercentage) {
                    const absValue = Math.abs(parseFloat(percentageText) || 0);
                    setFormData((prev) => ({ ...prev, value: absValue }));
                  } else {
                    const absValue = Math.abs(parseFloat(amountText) || 0);
                    setFormData((prev) => ({ ...prev, amount: absValue }));
                  }
                }}
                style={[
                  styles.operationButton,
                  !isDiscount && {
                    backgroundColor: theme.colors.primaryContainer,
                    borderColor: theme.colors.primary,
                  },
                ]}
                labelStyle={{
                  color: !isDiscount
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.primary,
                }}
                icon="plus"
              >
                Cargo
              </Button>
            </View>
          </View>

          {/* Campo de valor */}
          {formData.isPercentage ? (
            <TextInput
              label="Porcentaje"
              value={percentageText}
              onChangeText={(text) => {
                // Solo permitir números positivos
                const regex = /^\d*\.?\d*$/;
                if (regex.test(text) || text === '') {
                  setPercentageText(text);
                  const value = parseFloat(text) || 0;
                  setFormData((prev) => ({
                    ...prev,
                    value: isDiscount ? -value : value,
                  }));
                }
              }}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.value}
              right={<TextInput.Affix text="%" />}
              style={styles.input}
            />
          ) : (
            <TextInput
              label="Monto"
              value={amountText}
              onChangeText={(text) => {
                // Solo permitir números positivos
                const regex = /^\d*\.?\d*$/;
                if (regex.test(text) || text === '') {
                  setAmountText(text);
                  const amount = parseFloat(text) || 0;
                  setFormData((prev) => ({
                    ...prev,
                    amount: isDiscount ? -amount : amount,
                  }));
                }
              }}
              mode="outlined"
              keyboardType="numeric"
              error={!!errors.amount}
              left={<TextInput.Affix text="$" />}
              style={styles.input}
            />
          )}
          {(errors.value || errors.amount) && (
            <HelperText type="error" visible={true}>
              {errors.value || errors.amount}
            </HelperText>
          )}
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
  },
  typeContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  chip: {
    flex: 1,
  },
  operationContainer: {
    marginBottom: 16,
  },
  operationButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  operationButton: {
    flex: 1,
  },
});
