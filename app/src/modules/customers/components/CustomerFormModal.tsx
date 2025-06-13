import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  Surface,
} from 'react-native-paper';
import {
  useForm,
  Controller,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { Customer } from '../types/customer.types';
import {
  CustomerFormInputs,
  customerFormSchema,
} from '../schema/customer.schema';
import DateInput from './DateInput';

interface CustomerFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSubmit: (data: CustomerFormInputs) => Promise<void>;
  editingItem: Customer | null;
  isSubmitting: boolean;
}

export default function CustomerFormModal({
  visible,
  onDismiss,
  onSubmit,
  editingItem,
  isSubmitting,
}: CustomerFormModalProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerFormInputs>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      birthDate: '',
      isActive: true,
    },
  });


  useEffect(() => {
    if (editingItem) {
      reset({
        firstName: editingItem.firstName,
        lastName: editingItem.lastName,
        phoneNumber: editingItem.phoneNumber || '',
        email: editingItem.email || '',
        birthDate: editingItem.birthDate 
          ? new Date(editingItem.birthDate).toISOString().split('T')[0] 
          : '',
        isActive: editingItem.isActive,
      });
    } else {
      reset({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        birthDate: '',
        isActive: true,
      });
    }
  }, [editingItem, reset]);


  const formatPhoneNumber = (text: string) => {
    // Eliminar todos los caracteres no numéricos
    const cleaned = text.replace(/\D/g, '');
    
    // Formatear según la longitud
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
    } else {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6, 10)}`;
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalContent} elevation={4}>
          <Text style={styles.modalTitle} variant="titleLarge">
            {editingItem ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Text>

          <ScrollView style={styles.formContainer}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Nombre *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.firstName}
                    mode="outlined"
                    placeholder="Ej: Juan"
                  />
                  {errors.firstName && (
                    <HelperText type="error" visible={!!errors.firstName}>
                      {errors.firstName.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Apellido *"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.lastName}
                    mode="outlined"
                    placeholder="Ej: Pérez"
                  />
                  {errors.lastName && (
                    <HelperText type="error" visible={!!errors.lastName}>
                      {errors.lastName.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Teléfono"
                    value={formatPhoneNumber(value || '')}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/\D/g, '');
                      onChange(cleaned);
                    }}
                    onBlur={onBlur}
                    error={!!errors.phoneNumber}
                    mode="outlined"
                    placeholder="55 1234 5678"
                    keyboardType="phone-pad"
                    maxLength={13} // Para formato "55 1234 5678"
                  />
                  {errors.phoneNumber && (
                    <HelperText type="error" visible={!!errors.phoneNumber}>
                      {errors.phoneNumber.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Correo electrónico"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.email}
                    mode="outlined"
                    placeholder="juan@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && (
                    <HelperText type="error" visible={!!errors.email}>
                      {errors.email.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="birthDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <DateInput
                    label="Fecha de nacimiento"
                    value={value || ''}
                    onChange={onChange}
                    onBlur={onBlur}
                    error={!!errors.birthDate}
                    placeholder="Seleccionar fecha"
                  />
                  {errors.birthDate && (
                    <HelperText type="error" visible={!!errors.birthDate}>
                      {errors.birthDate.message}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="isActive"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Cliente activo</Text>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    color={theme.colors.primary}
                  />
                </View>
              )}
            />
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              mode="text"
              onPress={onDismiss}
              disabled={isSubmitting}
              style={styles.button}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={styles.button}
            >
              {editingItem ? 'Guardar' : 'Crear'}
            </Button>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      margin: theme.spacing.l,
    },
    modalContent: {
      padding: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      maxHeight: '90%',
    },
    modalTitle: {
      marginBottom: theme.spacing.l,
      textAlign: 'center',
      fontWeight: '700',
    },
    formContainer: {
      marginBottom: theme.spacing.m,
    },
    inputContainer: {
      marginBottom: theme.spacing.m,
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.s,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.m,
    },
    switchLabel: {
      ...theme.fonts.bodyLarge,
      color: theme.colors.onSurfaceVariant,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.m,
    },
    button: {
      marginLeft: theme.spacing.s,
    },
  });