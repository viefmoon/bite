import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  Surface,
  IconButton,
  Chip,
  Avatar,
  SegmentedButtons,
  Divider,
  Icon,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useCreateUser, useUpdateUser } from '../hooks';
import type { User, RoleEnum } from '../types';

const userFormSchema = z.object({
  username: z.string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guión bajo'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .optional()
    .or(z.literal('')),
  firstName: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z.string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  phoneNumber: z.string()
    .regex(/^\+?[0-9\s-]+$/, 'Número de teléfono inválido')
    .optional()
    .or(z.literal('')),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
    .optional(),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  zipCode: z.string().optional().or(z.literal('')),
  role: z.number(),
  isActive: z.boolean(),
});

type UserFormInputs = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  user?: User | null;
}

export function UserFormModal({
  visible,
  onDismiss,
  user,
}: UserFormModalProps) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const [showPassword, setShowPassword] = useState(false);
  
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<UserFormInputs>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      gender: undefined,
      address: '',
      city: '',
      state: '',
      country: '',
      zipCode: '',
      role: 2, // Default to MANAGER role
      isActive: true,
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        username: user.username,
        email: user.email || '',
        password: '', // Never pre-fill password
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender,
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        country: user.country || '',
        zipCode: user.zipCode || '',
        role: user.role?.id || 2,
        isActive: user.isActive,
      });
    } else {
      reset({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        gender: undefined,
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        role: 2,
        isActive: true,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UserFormInputs) => {
    try {
      if (user) {
        // For update, only include password if it's provided
        const updateData = {
          ...data,
          password: data.password || undefined,
          role: { id: data.role },
        };
        await updateUserMutation.mutateAsync({ id: user.id, data: updateData });
      } else {
        // For create, password is required
        if (!data.password) {
          return; // Should be caught by validation
        }
        const createData = {
          ...data,
          password: data.password,
          role: { id: data.role },
        };
        await createUserMutation.mutateAsync(createData);
      }
      onDismiss();
    } catch (error) {
      // Error handling is done in the mutation hooks
    }
  };

  const isSubmitting = createUserMutation.isPending || updateUserMutation.isPending;

  const genderOptions = [
    { value: 'MALE', label: 'Masculino', icon: 'gender-male' },
    { value: 'FEMALE', label: 'Femenino', icon: 'gender-female' },
    { value: 'OTHER', label: 'Otro', icon: 'gender-transgender' },
    { value: 'PREFER_NOT_TO_SAY', label: 'Prefiero no decir', icon: 'help' },
  ];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.modalContent} elevation={5}>
          <View
            style={[
              styles.headerContainer,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <View style={styles.headerLeft}>
              <Avatar.Icon
                size={32}
                icon={user ? 'account-edit' : 'account-plus'}
                style={[
                  styles.headerIcon,
                  { backgroundColor: theme.colors.onPrimary + '20' },
                ]}
                color={theme.colors.onPrimary}
              />
              <View style={styles.headerTextContainer}>
                <Text
                  style={[
                    styles.modalTitle,
                    { color: theme.colors.onPrimary },
                  ]}
                  variant="titleMedium"
                >
                  {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                </Text>
              </View>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              disabled={isSubmitting}
              iconColor={theme.colors.onPrimary}
            />
          </View>

          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Información de Cuenta */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Información de Cuenta
                </Text>
                <Chip
                  mode="flat"
                  compact
                  style={styles.requiredChip}
                  textStyle={styles.requiredChipText}
                >
                  Requerido
                </Chip>
              </View>

              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Nombre de usuario"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.username}
                      mode="outlined"
                      placeholder="usuario123"
                      left={<TextInput.Icon icon="at" />}
                      outlineStyle={styles.inputOutline}
                      disabled={!!user} // Username can't be changed
                    />
                    {errors.username && (
                      <HelperText type="error" visible={!!errors.username}>
                        {errors.username.message}
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
                      label="Email (opcional)"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.email}
                      mode="outlined"
                      placeholder="usuario@ejemplo.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="email" />}
                      outlineStyle={styles.inputOutline}
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
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label={user ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.password}
                      mode="outlined"
                      placeholder="••••••"
                      secureTextEntry={!showPassword}
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? "eye-off" : "eye"}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                      outlineStyle={styles.inputOutline}
                    />
                    {errors.password && (
                      <HelperText type="error" visible={!!errors.password}>
                        {errors.password.message}
                      </HelperText>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel} variant="labelLarge">
                      Rol del usuario
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.rolesContainer}>
                        {[
                          { value: 1, label: 'Admin', icon: 'shield-account', description: 'Acceso completo' },
                          { value: 2, label: 'Gerente', icon: 'account-tie', description: 'Gestión general' },
                          { value: 3, label: 'Cajero', icon: 'cash-register', description: 'Cobros y ventas' },
                          { value: 4, label: 'Mesero', icon: 'room-service', description: 'Toma de órdenes' },
                          { value: 5, label: 'Cocina', icon: 'chef-hat', description: 'Preparación' },
                          { value: 6, label: 'Delivery', icon: 'moped', description: 'Entregas' },
                        ].map((role) => (
                          <Surface
                            key={role.value}
                            style={[
                              styles.roleCard,
                              value === role.value && styles.roleCardActive,
                            ]}
                            elevation={value === role.value ? 2 : 0}
                          >
                            <TouchableOpacity
                              onPress={() => onChange(role.value)}
                              style={styles.roleCardContent}
                            >
                              <Icon
                                source={role.icon}
                                size={28}
                                color={
                                  value === role.value
                                    ? theme.colors.primary
                                    : theme.colors.onSurfaceVariant
                                }
                              />
                              <Text
                                style={[
                                  styles.roleLabel,
                                  value === role.value && styles.roleLabelActive,
                                ]}
                                variant="labelMedium"
                              >
                                {role.label}
                              </Text>
                              <Text
                                style={styles.roleDescription}
                                variant="bodySmall"
                                numberOfLines={1}
                              >
                                {role.description}
                              </Text>
                            </TouchableOpacity>
                          </Surface>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Información Personal */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Información Personal
                </Text>
                <Chip
                  mode="flat"
                  compact
                  style={styles.requiredChip}
                  textStyle={styles.requiredChipText}
                >
                  Requerido
                </Chip>
              </View>

              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Nombre"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.firstName}
                      mode="outlined"
                      placeholder="Juan"
                      left={<TextInput.Icon icon="account" />}
                      outlineStyle={styles.inputOutline}
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
                      label="Apellido"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.lastName}
                      mode="outlined"
                      placeholder="Pérez"
                      left={<TextInput.Icon icon="account" />}
                      outlineStyle={styles.inputOutline}
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
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.fieldLabel} variant="labelLarge">
                      Género (opcional)
                    </Text>
                    <View style={styles.genderContainer}>
                      {genderOptions.map((option) => (
                        <Surface
                          key={option.value}
                          style={[
                            styles.genderOption,
                            value === option.value && styles.genderOptionActive,
                          ]}
                          elevation={value === option.value ? 2 : 0}
                        >
                          <IconButton
                            icon={option.icon}
                            size={20}
                            onPress={() => onChange(option.value)}
                            iconColor={
                              value === option.value
                                ? theme.colors.primary
                                : theme.colors.onSurfaceVariant
                            }
                          />
                          <Text
                            style={[
                              styles.genderLabel,
                              value === option.value && styles.genderLabelActive,
                            ]}
                            variant="labelSmall"
                          >
                            {option.label}
                          </Text>
                        </Surface>
                      ))}
                    </View>
                  </View>
                )}
              />
            </View>

            <Divider style={styles.divider} />

            {/* Información de Contacto */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Información de Contacto
                </Text>
                <Chip
                  mode="flat"
                  compact
                  style={styles.optionalChip}
                  textStyle={styles.optionalChipText}
                >
                  Opcional
                </Chip>
              </View>

              <Controller
                control={control}
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Teléfono"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.phoneNumber}
                      mode="outlined"
                      placeholder="+52 55 1234 5678"
                      keyboardType="phone-pad"
                      left={<TextInput.Icon icon="phone" />}
                      outlineStyle={styles.inputOutline}
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
                name="address"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Dirección"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      placeholder="Calle Principal #123"
                      left={<TextInput.Icon icon="map-marker" />}
                      outlineStyle={styles.inputOutline}
                    />
                  </View>
                )}
              />

              <View style={styles.rowContainer}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, styles.halfInput]}>
                      <TextInput
                        label="Ciudad"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        mode="outlined"
                        placeholder="Ciudad"
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="state"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, styles.halfInput]}>
                      <TextInput
                        label="Estado"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        mode="outlined"
                        placeholder="Estado"
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                  )}
                />
              </View>

              <View style={styles.rowContainer}>
                <Controller
                  control={control}
                  name="country"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, styles.halfInput]}>
                      <TextInput
                        label="País"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        mode="outlined"
                        placeholder="México"
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                  )}
                />

                <Controller
                  control={control}
                  name="zipCode"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={[styles.inputContainer, styles.halfInput]}>
                      <TextInput
                        label="Código Postal"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        mode="outlined"
                        placeholder="12345"
                        keyboardType="number-pad"
                        outlineStyle={styles.inputOutline}
                      />
                    </View>
                  )}
                />
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Estado de la cuenta */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Estado de la cuenta
                </Text>
              </View>

              <Controller
                control={control}
                name="isActive"
                render={({ field: { onChange, value } }) => (
                  <Surface style={styles.switchContainer} elevation={1}>
                    <View style={styles.switchContent}>
                      <View style={styles.switchTextContainer}>
                        <Text style={styles.switchLabel} variant="bodyLarge">
                          Usuario activo
                        </Text>
                        <Text
                          style={styles.switchDescription}
                          variant="bodySmall"
                        >
                          Los usuarios inactivos no pueden iniciar sesión
                        </Text>
                      </View>
                      <Switch
                        value={value}
                        onValueChange={onChange}
                        color={theme.colors.primary}
                      />
                    </View>
                  </Surface>
                )}
              />
            </View>

            {/* Información adicional en modo edición */}
            {user && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información del sistema
                  </Text>
                </View>

                <Surface style={styles.infoCard} elevation={1}>
                  <View style={styles.infoRow}>
                    <Icon
                      source="identifier"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel} variant="labelSmall">
                        ID del usuario
                      </Text>
                      <Text style={styles.infoValue} variant="bodyMedium">
                        {user.id}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.infoDivider} />

                  <View style={styles.infoRow}>
                    <Icon
                      source="calendar-plus"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel} variant="labelSmall">
                        Fecha de creación
                      </Text>
                      <Text style={styles.infoValue} variant="bodyMedium">
                        {new Date(user.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  <Divider style={styles.infoDivider} />

                  <View style={styles.infoRow}>
                    <Icon
                      source="calendar-edit"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel} variant="labelSmall">
                        Última actualización
                      </Text>
                      <Text style={styles.infoValue} variant="bodyMedium">
                        {new Date(user.updatedAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </Surface>
              </View>
            )}

            {/* Espacio adicional para el teclado */}
            <View style={{ height: 20 }} />
          </ScrollView>

          <Surface style={styles.buttonContainer} elevation={2}>
            <Button
              onPress={onDismiss}
              disabled={isSubmitting}
              style={[styles.button, styles.cancelButton]}
              textColor={theme.colors.onSecondaryContainer}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              loading={isSubmitting}
              style={[styles.button, styles.confirmButton]}
              buttonColor={theme.colors.primary}
            >
              {user ? 'Guardar' : 'Crear'}
            </Button>
          </Surface>
        </Surface>
      </Modal>
    </Portal>
  );
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      margin: 20,
    },
    modalContent: {
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surface,
      maxHeight: '90%',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderTopLeftRadius: theme.roundness * 3,
      borderTopRightRadius: theme.roundness * 3,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      marginRight: theme.spacing.s,
    },
    headerTextContainer: {
      flex: 1,
    },
    modalTitle: {
      fontWeight: '700',
    },
    formContainer: {
      maxHeight: 400,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.s,
    },
    sectionContainer: {
      marginBottom: theme.spacing.m,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 15,
    },
    requiredChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    requiredChipText: {
      color: theme.colors.onErrorContainer,
      fontSize: 11,
    },
    optionalChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    optionalChipText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
    },
    inputContainer: {
      marginBottom: theme.spacing.s,
    },
    inputOutline: {
      borderRadius: theme.roundness * 2,
    },
    fieldLabel: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.s,
      fontWeight: '500',
    },
    segmentedButtons: {
      marginTop: theme.spacing.xs,
    },
    genderContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      flexWrap: 'wrap',
    },
    genderOption: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.xs,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      minWidth: 80,
    },
    genderOptionActive: {
      backgroundColor: theme.colors.primaryContainer,
    },
    genderLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      fontSize: 11,
    },
    genderLabelActive: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '600',
    },
    rowContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    halfInput: {
      flex: 1,
    },
    switchContainer: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.s,
    },
    switchContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchTextContainer: {
      flex: 1,
      marginRight: theme.spacing.m,
    },
    switchLabel: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    switchDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    divider: {
      marginVertical: theme.spacing.s,
    },
    infoCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    infoContent: {
      flex: 1,
    },
    infoLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    infoValue: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    infoDivider: {
      marginVertical: theme.spacing.s,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      gap: theme.spacing.s,
    },
    button: {
      flex: 1,
      maxWidth: 150,
    },
    cancelButton: {
      backgroundColor: theme.colors.secondaryContainer,
    },
    confirmButton: {},
    rolesContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
    },
    roleCard: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
      marginRight: theme.spacing.s,
      minWidth: 100,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    roleCardActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    roleCardContent: {
      alignItems: 'center',
    },
    roleLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: theme.spacing.xs,
      fontWeight: '500',
    },
    roleLabelActive: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '700',
    },
    roleDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      fontSize: 10,
      textAlign: 'center',
    },
  });