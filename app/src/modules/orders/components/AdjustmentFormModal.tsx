import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  TextInput,
  HelperText,
  RadioButton,
  Appbar,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import type { OrderAdjustment, AdjustmentFormData } from '../types/adjustments.types';

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
  
  // Log para debug
  console.log('AdjustmentFormModal - visible:', visible, 'orderSubtotal:', orderSubtotal);

  // Estado del formulario
  const [formData, setFormData] = useState<AdjustmentFormData>({
    name: '',
    isPercentage: true,
    value: 0,
    amount: 0,
  });

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
      } else {
        setFormData({
          name: '',
          isPercentage: true,
          value: 0,
          amount: 0,
        });
      }
      setErrors({});
    }
  }, [visible, adjustment]);

  // Calcular el monto cuando cambia el valor o tipo
  useEffect(() => {
    if (formData.isPercentage && formData.value !== undefined) {
      const calculatedAmount = (orderSubtotal * formData.value) / 100;
      setFormData(prev => ({ ...prev, amount: calculatedAmount }));
    }
  }, [formData.isPercentage, formData.value, orderSubtotal]);

  const handleTypeChange = (isPercentage: boolean) => {
    setFormData(prev => ({
      ...prev,
      isPercentage,
      value: isPercentage ? 0 : undefined,
      amount: isPercentage ? 0 : prev.amount,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (formData.isPercentage) {
      if (formData.value === undefined || formData.value === null) {
        newErrors.value = 'El porcentaje es requerido';
      } else if (formData.value < -100 || formData.value > 100) {
        newErrors.value = 'El porcentaje debe estar entre -100 y 100';
      }
    } else {
      if (formData.amount === undefined || formData.amount === null) {
        newErrors.amount = 'El monto es requerido';
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
        <View style={styles.modalContent}>
          <Appbar.Header>
            <Appbar.Content
              title={adjustment ? 'Editar Ajuste' : 'Nuevo Ajuste'}
            />
            <Appbar.Action icon="close" onPress={onDismiss} />
          </Appbar.Header>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              {/* Nombre del ajuste */}
              <TextInput
                label="Nombre del ajuste"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData(prev => ({ ...prev, name: text }))
                }
                mode="outlined"
                error={!!errors.name}
                placeholder="Ej: Descuento por cliente frecuente"
              />
              <HelperText type="error" visible={!!errors.name}>
                {errors.name}
              </HelperText>

              {/* Tipo de ajuste */}
              <View style={styles.typeSection}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Tipo de ajuste
                </Text>
                <RadioButton.Group
                  onValueChange={(value) => handleTypeChange(value === 'percentage')}
                  value={formData.isPercentage ? 'percentage' : 'fixed'}
                >
                  <View style={styles.radioOption}>
                    <RadioButton value="percentage" />
                    <Text>Porcentaje</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="fixed" />
                    <Text>Monto fijo</Text>
                  </View>
                </RadioButton.Group>
              </View>

              {/* Valor según el tipo */}
              {formData.isPercentage ? (
                <>
                  <TextInput
                    label="Porcentaje (%)"
                    value={formData.value?.toString() || ''}
                    onChangeText={(text) => {
                      const value = parseFloat(text) || 0;
                      setFormData(prev => ({ ...prev, value }));
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    error={!!errors.value}
                    left={<TextInput.Affix text="%" />}
                  />
                  <HelperText type="error" visible={!!errors.value}>
                    {errors.value}
                  </HelperText>
                  <HelperText type="info">
                    Usa valores negativos para descuentos, positivos para cargos
                  </HelperText>
                </>
              ) : (
                <>
                  <TextInput
                    label="Monto"
                    value={formData.amount?.toString() || ''}
                    onChangeText={(text) => {
                      const amount = parseFloat(text) || 0;
                      setFormData(prev => ({ ...prev, amount }));
                    }}
                    mode="outlined"
                    keyboardType="numeric"
                    error={!!errors.amount}
                    left={<TextInput.Affix text="$" />}
                  />
                  <HelperText type="error" visible={!!errors.amount}>
                    {errors.amount}
                  </HelperText>
                  <HelperText type="info">
                    Usa valores negativos para descuentos, positivos para cargos
                  </HelperText>
                </>
              )}

              {/* Resumen del ajuste */}
              <View style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text variant="titleSmall">Resumen del ajuste</Text>
                <View style={styles.summaryRow}>
                  <Text>Subtotal de la orden:</Text>
                  <Text variant="titleMedium">${orderSubtotal.toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text>Ajuste aplicado:</Text>
                  <Text
                    variant="titleMedium"
                    style={{
                      color: formData.amount < 0 ? theme.colors.error : theme.colors.primary,
                    }}
                  >
                    {formData.amount < 0 ? '-' : '+'}${Math.abs(formData.amount).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.actionButton}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.actionButton}
            >
              {adjustment ? 'Actualizar' : 'Agregar'}
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 12,
    height: '80%',
  },
  modalContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  typeSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 8,
  },
  actionButton: {
    minWidth: 100,
  },
});