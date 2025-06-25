import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  HelperText,
  Chip,
  IconButton,
  Icon,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type {
  OrderAdjustment,
  AdjustmentFormData,
} from '../types/adjustments.types';

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
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Header simplificado */}
        <View
          style={[styles.header, { backgroundColor: theme.colors.primary }]}
        >
          <Text
            variant="titleLarge"
            style={[styles.title, { color: theme.colors.onPrimary }]}
          >
            {adjustment ? 'Editar Ajuste' : 'Nuevo Ajuste'}
          </Text>
          <IconButton
            icon="close"
            size={20}
            onPress={onDismiss}
            style={styles.closeButton}
            iconColor={theme.colors.onPrimary}
          />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
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
        </View>

        {/* Botones de acción */}
        <View
          style={[
            styles.actions,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Button
            mode="outlined"
            onPress={onDismiss}
            style={[
              styles.actionButton,
              {
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.secondaryContainer,
              },
            ]}
            textColor={theme.colors.onSecondaryContainer}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.actionButton, styles.saveButton]}
            buttonColor={theme.colors.primary}
          >
            {adjustment ? 'Actualizar' : 'Guardar'}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  title: {
    flex: 1,
    fontWeight: '500',
  },
  closeButton: {
    margin: -4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
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
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    minWidth: 100,
  },
  saveButton: {
    marginLeft: 4,
  },
});
