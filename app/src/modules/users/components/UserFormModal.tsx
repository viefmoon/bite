import { useEffect, useState, useMemo, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  TextInput,
  Switch,
  HelperText,
  Surface,
  Chip,
  Icon,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { z } from 'zod';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import { useCreateUser, useUpdateUser } from '../hooks';
import type { User } from '@/app/schemas/domain/user.schema';
import { GenderEnum } from '../schema/user.schema';
import { RoleSelector } from './RoleSelector';
import { GenderSelector } from './GenderSelector';

const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(20, 'El nombre de usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Solo se permiten letras, números y guión bajo'),
  email: z
    .union([z.string().email('Email inválido'), z.literal('')])
    .optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres'),
  phoneNumber: z
    .union([
      z.string().regex(/^\+?[0-9\s-]+$/, 'Número de teléfono inválido'),
      z.literal(''),
    ])
    .optional(),
  gender: z.nativeEnum(GenderEnum).nullable().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  role: z.number(),
  isActive: z.boolean(),
});

const updateUserSchema = createUserSchema.omit({ password: true }).extend({
  password: z
    .union([
      z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      z.literal(''),
    ])
    .optional(),
});

type CreateUserFormInputs = z.infer<typeof createUserSchema>;
type UpdateUserFormInputs = z.infer<typeof updateUserSchema>;
type UserFormInputs = CreateUserFormInputs | UpdateUserFormInputs;

interface UserFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  user?: User | null;
}

// Constantes extraídas del componente para evitar recreación
const GENDER_OPTIONS = [
  {
    value: GenderEnum.MALE,
    label: 'Masculino',
    icon: 'gender-male',
    color: '#3498db',
  },
  {
    value: GenderEnum.FEMALE,
    label: 'Femenino',
    icon: 'gender-female',
    color: '#e74c3c',
  },
  {
    value: GenderEnum.OTHER,
    label: 'Otro',
    icon: 'gender-transgender',
    color: '#9b59b6',
  },
];

const ROLE_OPTIONS = [
  {
    value: 1,
    label: 'Admin',
    icon: 'shield-account',
    description: 'Acceso completo',
  },
  {
    value: 2,
    label: 'Gerente',
    icon: 'account-tie',
    description: 'Gestión general',
  },
  {
    value: 3,
    label: 'Cajero',
    icon: 'cash-register',
    description: 'Ventas',
  },
  {
    value: 4,
    label: 'Mesero',
    icon: 'room-service',
    description: 'Órdenes',
  },
  {
    value: 5,
    label: 'Cocina',
    icon: 'chef-hat',
    description: 'Preparación',
  },
  {
    value: 6,
    label: 'Repartidor',
    icon: 'moped',
    description: 'Entregas',
  },
];

export function UserFormModal({
  visible,
  onDismiss,
  user,
}: UserFormModalProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = useMemo(
    () => getStyles(theme, responsive),
    [theme, responsive],
  );
  const [showPassword, setShowPassword] = useState(false);

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserFormInputs>({
    resolver: zodResolver(user ? updateUserSchema : createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      gender: null,
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
        gender: user.gender || null,
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
        gender: null,
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

  const onSubmit = useCallback(
    async (data: CreateUserFormInputs | UpdateUserFormInputs) => {
      try {
        // Clean empty strings to undefined
        const cleanData = {
          username: data.username,
          email: data.email || undefined,
          password: data.password || undefined,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber || undefined,
          gender: data.gender || null,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          country: data.country || undefined,
          zipCode: data.zipCode || undefined,
          role: { id: data.role },
          isActive: data.isActive,
        };

        if (user) {
          const { username: _username, password, ...updateData } = cleanData;
          const finalUpdateData = password
            ? { ...updateData, password }
            : updateData;

          await updateUserMutation.mutateAsync({
            id: user.id,
            data: finalUpdateData,
          });
        } else {
          if (!data.password) {
            return;
          }
          const createData = {
            ...cleanData,
            password: data.password,
          };
          await createUserMutation.mutateAsync(createData);
        }
        onDismiss();
      } catch (error) {
        // Error is handled by mutation hooks
      }
    },
    [user, updateUserMutation, createUserMutation, onDismiss],
  );

  const isSubmitting =
    createUserMutation.isPending || updateUserMutation.isPending;

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      maxWidthPercent={95}
      maxHeightPercent={90}
      title={user ? 'Editar Usuario' : 'Nuevo Usuario'}
      dismissable={!isSubmitting}
      isLoading={isSubmitting}
      actions={[
        {
          label: 'Cancelar',
          mode: 'outlined',
          onPress: onDismiss,
          disabled: isSubmitting,
          colorPreset: 'secondary',
        },
        {
          label: user ? 'Guardar' : 'Crear',
          mode: 'contained',
          onPress: handleSubmit(onSubmit),
          loading: isSubmitting,
          disabled: isSubmitting,
          colorPreset: 'primary',
        },
      ]}
    >
      <View style={styles.formContainer}>
        <View style={styles.contentWrapper}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon
                source="account-key"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle} variant="titleMedium">
                Información de Cuenta
              </Text>
              <Chip
                mode="flat"
                compact
                icon="check"
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
                    left={<TextInput.Icon icon="account" />}
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    style={styles.input}
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
                    contentStyle={styles.inputContent}
                    style={styles.input}
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
                    label={
                      user
                        ? 'Nueva contraseña (dejar vacío para no cambiar)'
                        : 'Contraseña'
                    }
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
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={togglePasswordVisibility}
                      />
                    }
                    outlineStyle={styles.inputOutline}
                    contentStyle={styles.inputContent}
                    style={styles.input}
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
                <RoleSelector
                  value={value}
                  onChange={onChange}
                  roles={ROLE_OPTIONS}
                  theme={theme}
                  responsive={responsive}
                />
              )}
            />
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon
                source="account-circle"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle} variant="titleMedium">
                Información Personal
              </Text>
              <Chip
                mode="flat"
                compact
                icon="check"
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
                    contentStyle={styles.inputContent}
                    style={styles.input}
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
                    contentStyle={styles.inputContent}
                    style={styles.input}
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
                <GenderSelector
                  value={value ?? null}
                  onChange={onChange}
                  options={GENDER_OPTIONS}
                  theme={theme}
                  responsive={responsive}
                />
              )}
            />
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon
                source="phone-in-talk"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.sectionTitle} variant="titleMedium">
                Información de Contacto
              </Text>
              <Chip
                mode="flat"
                compact
                icon="information"
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
                    contentStyle={styles.inputContent}
                    style={styles.input}
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
                    contentStyle={styles.inputContent}
                    style={styles.input}
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

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon
                source="shield-check"
                size={20}
                color={theme.colors.primary}
              />
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

          <View style={styles.scrollSpacer} />
        </View>
      </View>
    </ResponsiveModal>
  );
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    formContainer: {
      flex: 1,
    },
    contentWrapper: {
      flex: 1,
      paddingHorizontal: responsive.isTablet
        ? theme.spacing.m
        : theme.spacing.s,
      paddingTop: responsive.isTablet ? theme.spacing.s : theme.spacing.xs,
    },
    sectionContainer: {
      marginBottom: responsive.isTablet ? theme.spacing.s : theme.spacing.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
      gap: theme.spacing.xs,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 14 : 13,
      flex: 1,
    },
    requiredChip: {
      backgroundColor: theme.colors.primary + '20',
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    requiredChipText: {
      color: theme.colors.primary,
      fontSize: 11,
      fontWeight: '600',
    },
    optionalChip: {
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    optionalChipText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
    },
    inputContainer: {
      marginBottom: theme.spacing.xs,
    },
    inputOutline: {
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
    },
    input: {
      fontSize: responsive.isTablet ? 14 : 13,
      backgroundColor: theme.colors.surface,
      height: responsive.isTablet ? 48 : 44,
    },
    inputContent: {
      paddingVertical: 2,
      fontSize: responsive.isTablet ? 14 : 13,
      fontFamily: 'System',
    },
    fieldLabel: {
      color: theme.colors.onSurfaceVariant,
      marginBottom: theme.spacing.xs,
      fontWeight: '600',
      fontSize: 12,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      fontFamily: 'System',
    },
    fieldLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
    segmentedButtons: {
      marginTop: theme.spacing.xs,
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
      backgroundColor: theme.colors.primaryContainer + '20',
      borderWidth: 1,
      borderColor: theme.colors.primary + '30',
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
    scrollSpacer: {
      height: 10,
    },
  });
