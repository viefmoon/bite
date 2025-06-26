import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  TextInput,
  Button,
  Surface,
  IconButton,
  HelperText,
  Divider,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pizzaConfigurationsService } from '../services/pizzaConfigurationsService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import type { Product } from '@/modules/menu/schema/products.schema';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

interface PizzaConfigurationModalProps {
  visible: boolean;
  onDismiss: () => void;
  product: Product | null;
}

const configurationSchema = z.object({
  includedToppings: z.number().int().min(0),
  extraToppingCost: z.number().min(0),
});

type ConfigurationFormData = z.infer<typeof configurationSchema>;

export function PizzaConfigurationModal({ 
  visible, 
  onDismiss, 
  product 
}: PizzaConfigurationModalProps) {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [extraCostText, setExtraCostText] = useState('20.00');

  // Query para obtener la configuración existente
  const { data: configuration, isLoading } = useQuery({
    queryKey: ['pizza-configuration', product?.id],
    queryFn: async () => {
      if (!product?.id) return null;
      try {
        return await pizzaConfigurationsService.findByProductId(product.id);
      } catch (error) {
        return null;
      }
    },
    enabled: !!product?.id && visible,
  });

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    getValues,
  } = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: {
      includedToppings: 4,
      extraToppingCost: 20,
    },
  });

  // Cargar datos de configuración existente
  useEffect(() => {
    if (visible && product) {
      if (configuration && configuration.extraToppingCost !== undefined && configuration.extraToppingCost !== null) {
        const cost = Number(configuration.extraToppingCost);
        const toppings = Number(configuration.includedToppings) || 4;
        reset({
          includedToppings: toppings,
          extraToppingCost: cost,
        });
        setExtraCostText(cost.toFixed(2));
        // Asegurar que el valor esté sincronizado
        setValue('extraToppingCost', cost, { shouldValidate: false });
      } else {
        // Reset a valores por defecto cuando se abre el modal sin configuración
        const defaultCost = 20;
        const defaultToppings = 4;
        reset({
          includedToppings: defaultToppings,
          extraToppingCost: defaultCost,
        });
        setExtraCostText(defaultCost.toFixed(2));
        // Asegurar que el valor esté sincronizado
        setValue('extraToppingCost', defaultCost, { shouldValidate: false });
      }
    }
  }, [configuration, reset, visible, product, setValue]);

  // Mutation para guardar
  const saveMutation = useMutation({
    mutationFn: async (data: ConfigurationFormData) => {
      if (!product) throw new Error('No product selected');
      
      if (configuration) {
        return await pizzaConfigurationsService.update(configuration.id, data);
      } else {
        return await pizzaConfigurationsService.create({
          ...data,
          productId: product.id,
        });
      }
    },
    onSuccess: () => {
      showSnackbar({
        message: 'Configuración guardada exitosamente',
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['pizza-configuration', product?.id] });
      queryClient.invalidateQueries({ queryKey: ['pizza-configurations'] });
      onDismiss();
    },
    onError: (error) => {
      showSnackbar({
        message: error instanceof Error ? error.message : 'Error al guardar',
        type: 'error',
      });
    },
  });

  const onSubmit = (data: ConfigurationFormData) => {
    saveMutation.mutate(data);
  };

  const styles = StyleSheet.create({
    modal: {
      backgroundColor: theme.colors.background,
      margin: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.m,
      paddingBottom: 0,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    closeButton: {
      margin: 0,
    },
    content: {
      padding: theme.spacing.m,
    },
    productInfo: {
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.l,
    },
    productName: {
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      marginBottom: theme.spacing.m,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    input: {
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    helperText: {
      marginTop: -theme.spacing.s,
      marginBottom: theme.spacing.m,
    },
    infoBox: {
      backgroundColor: theme.colors.primaryContainer,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.m,
    },
    infoText: {
      color: theme.colors.onPrimaryContainer,
      fontSize: 12,
    },
    example: {
      marginTop: theme.spacing.m,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    exampleTitle: {
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
    },
    exampleText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
      paddingTop: theme.spacing.s,
      gap: theme.spacing.m,
    },
    actionButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    },
    cancelButton: {
      borderColor: theme.colors.outlineVariant,
    },
    saveButton: {
      borderWidth: 0,
    },
  });

  if (!product) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          if (isDirty) {
            setShowConfirmation(true);
          } else {
            onDismiss();
          }
        }}
        contentContainerStyle={styles.modal}
        dismissable={true}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Configuración de Pizza</Text>
          <IconButton
            icon="close"
            size={24}
            onPress={() => {
              if (isDirty) {
                setShowConfirmation(true);
              } else {
                onDismiss();
              }
            }}
            style={styles.closeButton}
          />
        </View>

        <Divider />

        <ScrollView style={styles.content}>
          <View style={styles.productInfo}>
            <Text variant="titleMedium" style={styles.productName}>
              {product.name}
            </Text>
            <Text variant="bodySmall">
              {product.variants?.length || 0} tamaños disponibles
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                ℹ️ Esta configuración determina cuántos toppings están incluidos en el precio base 
                y cuánto se cobra por cada topping adicional.
              </Text>
            </View>

            <Controller
              control={control}
              name="includedToppings"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  label="Toppings incluidos en el precio base *"
                  value={value?.toString() || ''}
                  onChangeText={(text) => {
                    // Solo permitir números enteros
                    const cleanText = text.replace(/[^0-9]/g, '');
                    if (cleanText === '') {
                      onChange(0);
                    } else {
                      const num = parseInt(cleanText, 10);
                      onChange(isNaN(num) ? 0 : num);
                    }
                  }}
                  onBlur={onBlur}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="number-pad"
                  error={!!errors.includedToppings}
                />
              )}
            />
            {errors.includedToppings && (
              <HelperText type="error" visible style={styles.helperText}>
                Debe ser un número entero mayor o igual a 0
              </HelperText>
            )}
            <HelperText type="info" visible style={styles.helperText}>
              Cantidad de toppings que el cliente puede elegir sin costo adicional
            </HelperText>

            <Controller
              control={control}
              name="extraToppingCost"
              render={({ field: { onChange, onBlur } }) => (
                <TextInput
                  label="Costo por topping adicional *"
                  value={extraCostText}
                  onChangeText={(text) => {
                    // Permitir números y punto decimal
                    let cleanText = text.replace(/[^0-9.]/g, '');
                    
                    // Evitar múltiples puntos decimales
                    const parts = cleanText.split('.');
                    if (parts.length > 2) {
                      cleanText = parts[0] + '.' + parts.slice(1).join('');
                    }
                    
                    // Limitar a 2 decimales
                    if (parts.length === 2 && parts[1].length > 2) {
                      cleanText = parts[0] + '.' + parts[1].substring(0, 2);
                    }
                    
                    // Actualizar el texto mostrado
                    setExtraCostText(cleanText);
                    
                    // Convertir a número y actualizar el formulario
                    const numValue = parseFloat(cleanText);
                    if (!isNaN(numValue)) {
                      onChange(numValue);
                      setValue('extraToppingCost', numValue, { shouldValidate: true });
                    } else if (cleanText === '' || cleanText === '.') {
                      onChange(0);
                      setValue('extraToppingCost', 0, { shouldValidate: true });
                    }
                  }}
                  onBlur={() => {
                    onBlur();
                    // Formatear al perder el foco
                    const numValue = parseFloat(extraCostText);
                    if (!isNaN(numValue)) {
                      setExtraCostText(numValue.toFixed(2));
                      setValue('extraToppingCost', numValue, { shouldValidate: true });
                    } else {
                      setExtraCostText('0.00');
                      setValue('extraToppingCost', 0, { shouldValidate: true });
                    }
                  }}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  error={!!errors.extraToppingCost}
                  left={<TextInput.Affix text="$" />}
                />
              )}
            />
            {errors.extraToppingCost && (
              <HelperText type="error" visible style={styles.helperText}>
                {errors.extraToppingCost.message || 'Debe ser un número mayor o igual a 0'}
              </HelperText>
            )}
            <HelperText type="info" visible style={styles.helperText}>
              Precio que se cobra por cada topping después de los incluidos
            </HelperText>

            <View style={styles.example}>
              <Text variant="labelLarge" style={styles.exampleTitle}>
                Ejemplo de cálculo:
              </Text>
              <Text style={styles.exampleText}>
                Si configuras 4 toppings incluidos y $20 por extra:{'\n'}
                • Cliente elige 4 toppings: Sin costo adicional{'\n'}
                • Cliente elige 6 toppings: +$40 (2 extras × $20)
              </Text>
            </View>
          </View>
        </ScrollView>

        <Divider />

        <View style={styles.actions}>
          <Button 
            mode="outlined" 
            onPress={() => {
              if (isDirty) {
                setShowConfirmation(true);
              } else {
                onDismiss();
              }
            }}
            style={[styles.actionButton, styles.cancelButton]}
            contentStyle={{ paddingVertical: 6 }}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={saveMutation.isPending}
            style={[styles.actionButton, styles.saveButton]}
            contentStyle={{ paddingVertical: 6 }}
          >
            Guardar
          </Button>
        </View>
      </Modal>
      
      <ConfirmationModal
        visible={showConfirmation}
        title="¿Salir sin guardar?"
        message="Los cambios se perderán"
        confirmText="Salir"
        cancelText="Cancelar"
        confirmButtonColor={theme.colors.error}
        onConfirm={() => {
          setShowConfirmation(false);
          reset();
          setExtraCostText('20.00');
          onDismiss();
        }}
        onCancel={() => setShowConfirmation(false)}
        onDismiss={() => setShowConfirmation(false)}
      />
    </Portal>
  );
}