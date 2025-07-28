import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  TextInput,
  Switch,
  Text,
  HelperText,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import type { ProductVariant } from '@/app/schemas/domain/product-variant.schema';
import { z } from 'zod';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

const variantFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  price: z.coerce
    .number({
      invalid_type_error: 'El precio debe ser un número',
      required_error: 'El precio es requerido',
    })
    .positive('El precio debe ser mayor a 0'),
  isActive: z.boolean(),
  sortOrder: z.number().optional().default(0),
});

type VariantFormData = z.infer<typeof variantFormSchema>;

interface VariantFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: ProductVariant) => void;
  initialData?: Partial<ProductVariant>;
}

function VariantFormModal({
  visible,
  onDismiss,
  onSubmit,
  initialData,
}: VariantFormModalProps): React.ReactElement {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isEditing = !!initialData?.name;
  const [priceInputValue, setPriceInputValue] = useState<string>('');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      price: initialData?.price ?? 0,
      isActive: initialData?.isActive ?? true,
      sortOrder: initialData?.sortOrder ?? 0,
      id: initialData?.id,
    },
  });

  const priceValue = watch('price');

  useEffect(() => {
    if (visible) {
      reset({
        name: initialData?.name ?? '',
        price: initialData?.price ?? 0,
        isActive: initialData?.isActive ?? true,
        sortOrder: initialData?.sortOrder ?? 0,
        id: initialData?.id,
      });
    }
  }, [visible, initialData, reset]);

  useEffect(() => {
    setPriceInputValue(
      priceValue !== undefined && priceValue !== null ? String(priceValue) : '',
    );
  }, [priceValue]);

  const handleFormSubmit = (data: VariantFormData) => {
    const finalData: ProductVariant = {
      ...data,
      ...(initialData?.id && { id: initialData.id }),
    } as ProductVariant;
    onSubmit(finalData);
  };

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      maxWidthPercent={85}
      maxHeightPercent={85}
      title={isEditing ? 'Editar Variante' : 'Nueva Variante'}
      actions={[
        {
          label: 'Cancelar',
          mode: 'outlined',
          onPress: onDismiss,
          disabled: isSubmitting,
          colorPreset: 'secondary'
        },
        {
          label: 'Guardar',
          mode: 'contained',
          onPress: handleSubmit(handleFormSubmit),
          loading: isSubmitting,
          disabled: isSubmitting,
          colorPreset: 'primary'
        }
      ]}
    >
      <View style={styles.content}>
            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Nombre Variante *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={styles.input}
                    autoFocus={!isEditing}
                  />
                )}
              />
              {errors.name && (
                <HelperText type="error" visible={!!errors.name}>
                  {errors.name.message}
                </HelperText>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="price"
                render={({ field }) => (
                  <TextInput
                    label="Precio *"
                    value={priceInputValue}
                    onChangeText={(text) => {
                      const formattedText = text.replace(/,/g, '.');
                      if (/^(\d*\.?\d*)$/.test(formattedText)) {
                        setPriceInputValue(formattedText);
                        if (formattedText === '') {
                          field.onChange(undefined);
                        } else if (formattedText !== '.') {
                          const numericValue = parseFloat(formattedText);
                          if (!isNaN(numericValue)) {
                            field.onChange(numericValue);
                          }
                        }
                      }
                    }}
                    onBlur={field.onBlur}
                    error={!!errors.price}
                    style={styles.input}
                    keyboardType="decimal-pad"
                  />
                )}
              />
              {errors.price && (
                <HelperText type="error" visible={!!errors.price}>
                  {errors.price.message}
                </HelperText>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Controller
                control={control}
                name="sortOrder"
                render={({ field }) => (
                  <TextInput
                    mode="outlined"
                    label="Orden de visualización"
                    value={String(field.value || 0)}
                    onChangeText={(text) => {
                      const value = parseInt(text, 10);
                      field.onChange(isNaN(value) ? 0 : value);
                    }}
                    onBlur={field.onBlur}
                    error={!!errors.sortOrder}
                    style={styles.input}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.sortOrder && (
                <HelperText type="error" visible={!!errors.sortOrder}>
                  {errors.sortOrder.message}
                </HelperText>
              )}
            </View>

            <View style={[styles.fieldContainer, styles.switchContainer]}>
              <Text style={styles.label}>Variante Activa</Text>
              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <Switch value={!!value} onValueChange={onChange} />
                )}
              />
            </View>
      </View>
    </ResponsiveModal>
  );
}

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    content: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    fieldContainer: {
      marginBottom: theme.spacing.m, // Espacio uniforme debajo de cada campo/grupo
    },
    input: {},
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      color: theme.colors.onSurfaceVariant,
    },
  });

export default VariantFormModal;
