import { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  TextInput,
  Button,
  HelperText,
  Surface,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Icon,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useMutation } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { registerSchema, RegisterFormInputs } from '../schema/auth.schema';

interface RegisterModalProps {
  visible: boolean;
  onDismiss: () => void;
  onRegisterSuccess?: (username: string, password: string) => void;
}

export function RegisterModal({
  visible,
  onDismiss,
  onRegisterSuccess,
}: RegisterModalProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = getStyles(theme, responsive);
  const [showPassword, setShowPassword] = useState(false);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 4, // Default a Mesero
    },
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: (data: RegisterFormInputs) => {
      const registerData = {
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || undefined,
        role: { id: data.role },
        isActive: true,
      };
      return authService.register(registerData);
    },
    onSuccess: (_, variables) => {
      showSnackbar({
        message: 'Registro exitoso. Ya puedes iniciar sesión.',
        type: 'success',
      });

      // Pasar los datos al formulario de login
      if (onRegisterSuccess) {
        onRegisterSuccess(variables.username, variables.password);
      }

      reset();
      onDismiss();
    },
    onError: (error: unknown) => {
      const userMessage = getApiErrorMessage(error);
      showSnackbar({
        message: userMessage,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const onSubmit = (data: RegisterFormInputs) => {
    register(data);
  };

  const handleDismiss = () => {
    reset();
    setShowPassword(false);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
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
                icon="account-plus"
                style={[
                  styles.headerIcon,
                  { backgroundColor: theme.colors.onPrimary + '20' },
                ]}
                color={theme.colors.onPrimary}
              />
              <View style={styles.headerTextContainer}>
                <Text
                  style={[styles.modalTitle, { color: theme.colors.onPrimary }]}
                  variant="titleMedium"
                >
                  Crear cuenta
                </Text>
              </View>
            </View>
            <IconButton
              icon="close"
              size={24}
              onPress={handleDismiss}
              disabled={isPending}
              iconColor={theme.colors.onPrimary}
            />
          </View>

          <ScrollView
            style={styles.formContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="account" />}
                      outlineStyle={styles.inputOutline}
                      contentStyle={styles.inputContent}
                      style={styles.input}
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
                      label="Email"
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
                      label="Contraseña"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.password}
                      mode="outlined"
                      placeholder="••••••"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      left={<TextInput.Icon icon="lock" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
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
                  <View style={styles.inputContainer}>
                    <View style={styles.fieldLabelContainer}>
                      <Icon
                        source="badge-account"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.sectionTitle} variant="titleMedium">
                        Tipo de cuenta
                      </Text>
                    </View>
                    <View style={styles.rolesContainer}>
                      {[
                        {
                          value: 4,
                          label: 'Mesero',
                          icon: 'room-service',
                          description: 'Tomar y gestionar órdenes',
                        },
                        {
                          value: 6,
                          label: 'Repartidor',
                          icon: 'moped',
                          description: 'Entregar pedidos',
                        },
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
                              size={24}
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
                              numberOfLines={2}
                            >
                              {role.description}
                            </Text>
                          </TouchableOpacity>
                        </Surface>
                      ))}
                    </View>
                  </View>
                )}
              />
            </View>

            <Divider style={styles.divider} />

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
                name="phoneNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Teléfono (opcional)"
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
            </View>
          </ScrollView>

          <Surface style={styles.buttonContainer} elevation={2}>
            <Button
              onPress={handleDismiss}
              disabled={isPending}
              style={[styles.button, styles.cancelButton]}
              textColor={theme.colors.onSecondaryContainer}
            >
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              loading={isPending}
              style={styles.button}
              buttonColor={theme.colors.primary}
            >
              Registrarse
            </Button>
          </Surface>
        </Surface>
      </Modal>
    </Portal>
  );
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    modalContainer: {
      margin: responsive.isTablet ? 20 : 12,
      maxWidth: responsive.isTablet ? 600 : '100%',
      alignSelf: 'center',
      width: responsive.isTablet ? '80%' : '94%',
    },
    modalContent: {
      borderRadius: responsive.isTablet
        ? theme.roundness * 3
        : theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      maxHeight: responsive.isTablet ? '90%' : '92%',
      minHeight: responsive.isTablet ? 600 : 550,
      overflow: 'hidden',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.spacingPreset.m,
      paddingVertical: responsive.spacingPreset.s,
      borderTopLeftRadius: theme.roundness * 3,
      borderTopRightRadius: theme.roundness * 3,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      marginRight: responsive.spacingPreset.s,
    },
    headerTextContainer: {
      flex: 1,
    },
    modalTitle: {
      fontWeight: '700',
    },
    formContainer: {
      flex: 1,
      paddingHorizontal: responsive.isTablet
        ? responsive.spacingPreset.m
        : responsive.spacingPreset.s,
      paddingTop: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
      paddingBottom: responsive.spacingPreset.xs,
    },
    sectionContainer: {
      marginBottom: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.isTablet ? responsive.spacingPreset.xs : 6,
      gap: responsive.isTablet ? responsive.spacingPreset.xs : 6,
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
      fontSize: responsive.isTablet ? 11 : 10,
      fontWeight: '600',
    },
    inputContainer: {
      marginBottom: responsive.isTablet ? responsive.spacingPreset.xs : 6,
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
      paddingVertical: responsive.isTablet ? 4 : 2,
      fontSize: responsive.isTablet ? 14 : 13,
      fontFamily: 'System',
    },
    fieldLabelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.isTablet ? responsive.spacingPreset.xs : 6,
      marginBottom: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
    },
    rolesContainer: {
      flexDirection: 'row',
      gap: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
      justifyContent: 'center',
    },
    roleCard: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
      backgroundColor: theme.colors.surface,
      minWidth: responsive.isTablet ? 140 : 125,
      borderWidth: 1.5,
      borderColor: theme.colors.outlineVariant,
      elevation: 1,
    },
    roleCardActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
      elevation: 3,
    },
    roleCardContent: {
      alignItems: 'center',
    },
    roleLabel: {
      color: theme.colors.onSurfaceVariant,
      marginTop: responsive.isTablet ? responsive.spacingPreset.xs : 4,
      fontWeight: '500',
      fontSize: responsive.isTablet ? 14 : 13,
    },
    roleLabelActive: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '700',
    },
    roleDescription: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      fontSize: responsive.isTablet ? 11 : 10,
      textAlign: 'center',
    },
    divider: {
      marginVertical: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
      marginHorizontal: responsive.isTablet
        ? -responsive.spacingPreset.m
        : -responsive.spacingPreset.s,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      gap: responsive.isTablet
        ? responsive.spacingPreset.s
        : responsive.spacingPreset.xs,
    },
    button: {
      flex: 1,
      maxWidth: responsive.isTablet ? 150 : 140,
    },
    cancelButton: {
      backgroundColor: theme.colors.secondaryContainer,
    },
  });
