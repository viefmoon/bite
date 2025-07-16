import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Surface,
  IconButton,
  Chip,
  Button,
  Dialog,
  TextInput,
  Icon,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { useResetPassword, useDeleteUser } from '../hooks';
import type { User } from '../types';

interface UserDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  user: User;
  onEdit: (user: User) => void;
}

export function UserDetailModal({
  visible,
  onDismiss,
  user,
  onEdit,
}: UserDetailModalProps) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = getStyles(theme, responsive);

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const resetPasswordMutation = useResetPassword();
  const deleteUserMutation = useDeleteUser();

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      return;
    }
    if (newPassword.length < 6) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        id: user.id,
        password: newPassword,
      });
      setShowPasswordDialog(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error handled in mutation
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUserMutation.mutateAsync(user.id);
      onDismiss();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const getGenderLabel = (gender?: string | null) => {
    switch (gender) {
      case 'male':
        return 'Masculino';
      case 'female':
        return 'Femenino';
      case 'other':
        return 'Otro';
      default:
        return 'No especificado';
    }
  };

  const getRoleInfo = (roleId?: number) => {
    switch (roleId) {
      case 1:
        return {
          label: 'Administrador',
          icon: 'shield-account',
          color: theme.colors.error,
        };
      case 2:
        return {
          label: 'Gerente',
          icon: 'account-tie',
          color: theme.colors.primary,
        };
      case 3:
        return {
          label: 'Cajero',
          icon: 'cash-register',
          color: theme.colors.tertiary,
        };
      case 4:
        return {
          label: 'Mesero',
          icon: 'room-service',
          color: theme.colors.secondary,
        };
      case 5:
        return { label: 'Cocina', icon: 'chef-hat', color: '#FF6B6B' };
      case 6:
        return { label: 'Repartidor', icon: 'moped', color: '#4ECDC4' };
      default:
        return {
          label: 'Sin rol',
          icon: 'account',
          color: theme.colors.onSurfaceVariant,
        };
    }
  };

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent} elevation={3}>
            {/* Header */}
            <View
              style={[
                styles.headerContainer,
                { backgroundColor: theme.colors.elevation.level2 },
              ]}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerNameRow}>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.colors.onSurface },
                    ]}
                    variant="titleMedium"
                  >
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                      user.username}
                  </Text>
                  <Chip
                    mode="flat"
                    icon={getRoleInfo(user.role?.id).icon}
                    style={[
                      styles.headerRoleChip,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    textStyle={[
                      styles.headerRoleChipText,
                      { color: getRoleInfo(user.role?.id).color },
                    ]}
                    compact
                  >
                    {getRoleInfo(user.role?.id).label}
                  </Chip>
                </View>
                <Text
                  style={[
                    styles.modalSubtitle,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                  variant="bodySmall"
                >
                  {user.username}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={20}
                onPress={onDismiss}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>

            <ScrollView
              style={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Contact Information */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Icon
                    source="contacts"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información de Contacto
                  </Text>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="email" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Email
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.email || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="phone" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Teléfono
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.phoneNumber || 'No especificado'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Personal Information */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Icon
                    source="account-details"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información Personal
                  </Text>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="account"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Nombre completo
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {`${user.firstName || 'No especificado'} ${user.lastName || 'No especificado'}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="gender-transgender"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Género
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {getGenderLabel(user.gender)}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="cake-variant"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Fecha de nacimiento
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.birthDate
                        ? new Date(user.birthDate).toLocaleDateString('es-MX', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source={
                      user.isActive
                        ? 'check-circle-outline'
                        : 'close-circle-outline'
                    }
                    size={18}
                    color={
                      user.isActive ? theme.colors.primary : theme.colors.error
                    }
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Estado de la cuenta
                    </Text>
                    <Text
                      style={[
                        styles.compactValue,
                        {
                          color: user.isActive
                            ? theme.colors.primary
                            : theme.colors.error,
                        },
                      ]}
                      variant="bodySmall"
                    >
                      {user.isActive ? 'Activa' : 'Inactiva'}
                    </Text>
                  </View>
                </View>

                {/* Preparation Screen for Kitchen Role */}
                {user.role?.id === 5 && (
                  <View style={styles.compactRow}>
                    <Icon
                      source="monitor"
                      size={18}
                      color={theme.colors.primary}
                    />
                    <View style={styles.compactContent}>
                      <Text style={styles.compactLabel} variant="labelSmall">
                        Pantalla de Preparación
                      </Text>
                      <Text style={styles.compactValue} variant="bodySmall">
                        {user.preparationScreen?.name || 'No asignada'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Address Information */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Icon
                    source="map-marker"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Dirección
                  </Text>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="home" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Dirección
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.address || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="city" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Ciudad
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.city || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="map" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Estado/Provincia
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.state || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="earth" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      País
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.country || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="mailbox"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Código Postal
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.zipCode || 'No especificado'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Emergency Contact */}
              <View style={styles.infoSection}>
                <View style={styles.sectionHeader}>
                  <Icon
                    source="alert-circle"
                    size={20}
                    color={theme.colors.error}
                  />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Contacto de Emergencia
                  </Text>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="account-alert"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Nombre
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.emergencyContact?.name || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="phone-alert"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Teléfono
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.emergencyContact?.phone || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon
                    source="account-multiple"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">
                      Relación
                    </Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.emergencyContact?.relationship || 'No especificado'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <Button
                  mode="contained-tonal"
                  onPress={() => onEdit(user)}
                  icon="pencil"
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  compact
                >
                  Editar Usuario
                </Button>

                <Button
                  mode="contained-tonal"
                  onPress={() => setShowPasswordDialog(true)}
                  icon="lock-reset"
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  buttonColor={theme.colors.secondaryContainer}
                  compact
                >
                  Cambiar Contraseña
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => setShowDeleteDialog(true)}
                  icon="delete"
                  style={[styles.actionButton, styles.deleteButton]}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                  textColor={theme.colors.error}
                  compact
                >
                  Eliminar Usuario
                </Button>
              </View>
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>

      {/* Password Reset Dialog */}
      <Portal>
        <Dialog
          visible={showPasswordDialog}
          onDismiss={() => {
            setShowPasswordDialog(false);
            setNewPassword('');
            setConfirmPassword('');
            setShowPassword(false);
          }}
          style={styles.passwordDialog}
        >
          <View
            style={[
              styles.passwordDialogContainer,
              { borderColor: theme.colors.primary },
            ]}
          >
            <View style={styles.passwordDialogHeader}>
              <Icon
                source="lock-reset"
                size={40}
                color={theme.colors.primary}
              />
              <Dialog.Title style={styles.passwordDialogTitle}>
                Cambiar Contraseña
              </Dialog.Title>
              <View style={styles.passwordDialogUserInfo}>
                <Text
                  variant="bodyMedium"
                  style={styles.passwordDialogUserName}
                >
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.username}
                </Text>
                <Text
                  variant="bodySmall"
                  style={styles.passwordDialogUserDetail}
                >
                  {user.email}
                </Text>
                <Text
                  variant="labelSmall"
                  style={styles.passwordDialogUserDetail}
                >
                  @{user.username}
                </Text>
              </View>
            </View>

            <Dialog.Content style={styles.passwordDialogContent}>
              <TextInput
                label="Nueva contraseña"
                value={newPassword}
                onChangeText={setNewPassword}
                mode="flat"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                style={styles.passwordInput}
                contentStyle={styles.passwordInputContent}
                underlineColor={theme.colors.surfaceVariant}
                activeUnderlineColor={theme.colors.primary}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={() => setShowPassword(!showPassword)}
                    size={20}
                    style={styles.passwordInputIcon}
                  />
                }
              />

              <TextInput
                label="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                mode="flat"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                style={styles.passwordInput}
                contentStyle={styles.passwordInputContent}
                underlineColor={theme.colors.surfaceVariant}
                activeUnderlineColor={theme.colors.primary}
              />

              {(newPassword.length > 0 || confirmPassword.length > 0) && (
                <View style={styles.passwordValidation}>
                  <View style={styles.validationItem}>
                    <Icon
                      source={
                        newPassword.length >= 6
                          ? 'check-circle'
                          : 'circle-outline'
                      }
                      size={16}
                      color={
                        newPassword.length >= 6
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.validationText,
                        {
                          color:
                            newPassword.length >= 6
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Mínimo 6 caracteres
                    </Text>
                  </View>

                  <View style={styles.validationItem}>
                    <Icon
                      source={
                        newPassword === confirmPassword &&
                        newPassword.length > 0
                          ? 'check-circle'
                          : 'circle-outline'
                      }
                      size={16}
                      color={
                        newPassword === confirmPassword &&
                        newPassword.length > 0
                          ? theme.colors.primary
                          : theme.colors.onSurfaceVariant
                      }
                    />
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.validationText,
                        {
                          color:
                            newPassword === confirmPassword &&
                            newPassword.length > 0
                              ? theme.colors.primary
                              : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      Las contraseñas coinciden
                    </Text>
                  </View>
                </View>
              )}
            </Dialog.Content>

            <Dialog.Actions style={styles.passwordDialogActions}>
              <Button
                mode="text"
                onPress={() => {
                  setShowPasswordDialog(false);
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowPassword(false);
                }}
                style={[
                  styles.passwordDialogButton,
                  styles.passwordDialogCancelButton,
                ]}
                labelStyle={styles.passwordDialogButtonLabel}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={handleResetPassword}
                loading={resetPasswordMutation.isPending}
                disabled={
                  resetPasswordMutation.isPending ||
                  newPassword.length < 6 ||
                  newPassword !== confirmPassword
                }
                style={[
                  styles.passwordDialogButton,
                  styles.passwordDialogPrimaryButton,
                ]}
                labelStyle={styles.passwordDialogButtonLabel}
              >
                Cambiar
              </Button>
            </Dialog.Actions>
          </View>
        </Dialog>
      </Portal>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={showDeleteDialog}
          onDismiss={() => setShowDeleteDialog(false)}
        >
          <Dialog.Icon icon="alert" color={theme.colors.error} />
          <Dialog.Title style={{ textAlign: 'center' }}>
            Eliminar Usuario
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ textAlign: 'center' }}>
              ¿Estás seguro de que deseas eliminar al usuario{' '}
              <Text style={{ fontWeight: 'bold' }}>{user.username}</Text>?
            </Text>
            <Text
              variant="bodySmall"
              style={{
                textAlign: 'center',
                marginTop: theme.spacing.s,
                color: theme.colors.error,
              }}
            >
              Esta acción no se puede deshacer
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button
              onPress={handleDeleteUser}
              loading={deleteUserMutation.isPending}
              disabled={deleteUserMutation.isPending}
              textColor={theme.colors.error}
            >
              Eliminar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    passwordDialog: {
      backgroundColor: 'transparent',
    },
    passwordDialogContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 4,
      borderWidth: 2,
      overflow: 'hidden',
    },
    passwordDialogHeader: {
      alignItems: 'center',
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.s,
      backgroundColor: theme.colors.elevation.level1,
    },
    passwordDialogTitle: {
      textAlign: 'center',
      fontSize: 20,
      fontWeight: '600',
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.s,
    },
    passwordDialogUserInfo: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.xs,
    },
    passwordDialogUserName: {
      textAlign: 'center',
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    passwordDialogUserDetail: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    passwordDialogContent: {
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    passwordInput: {
      backgroundColor: 'transparent',
      marginBottom: theme.spacing.m,
    },
    passwordInputContent: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 2,
      paddingHorizontal: theme.spacing.m,
      paddingRight: theme.spacing.m,
    },
    passwordInputIcon: {
      marginRight: -theme.spacing.xs,
    },
    passwordValidation: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      gap: theme.spacing.s,
    },
    validationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    validationText: {
      fontSize: 12,
    },
    passwordDialogActions: {
      justifyContent: 'center',
      paddingBottom: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
      gap: theme.spacing.s,
    },
    passwordDialogButton: {
      minWidth: 100,
      borderRadius: theme.roundness * 3,
    },
    passwordDialogCancelButton: {
      marginRight: theme.spacing.s,
    },
    passwordDialogPrimaryButton: {
      elevation: 0,
    },
    passwordDialogButtonLabel: {
      fontSize: 14,
      fontWeight: '600',
      letterSpacing: 0.1,
    },
    modalContainer: {
      margin: responsive.isTablet ? 30 : 20,
      maxWidth: responsive.isTablet ? 650 : '100%',
      alignSelf: 'center',
      width: responsive.isTablet ? '85%' : '100%',
    },
    modalContent: {
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surface,
      maxHeight: responsive.isTablet ? '90%' : '90%',
      minHeight: responsive.isTablet ? 600 : 400,
      overflow: 'hidden',
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing.m
        : theme.spacing.m,
      paddingVertical: responsive.isTablet
        ? responsive.spacing.s
        : theme.spacing.s,
      borderTopLeftRadius: theme.roundness * 3,
      borderTopRightRadius: theme.roundness * 3,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'column',
      justifyContent: 'center',
    },
    headerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    modalTitle: {
      fontWeight: '600',
      marginRight: theme.spacing.xs,
      fontSize: responsive.isTablet ? 15 : 16,
    },
    modalSubtitle: {
      marginTop: 2,
      fontSize: responsive.isTablet ? 12 : 14,
    },
    headerRoleChip: {
      minHeight: 28,
      height: 'auto',
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: responsive.spacing.s,
      paddingVertical: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRoleChipText: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
      marginVertical: 0,
      paddingVertical: 0,
      includeFontPadding: false,
    },
    contentContainer: {
      flex: 1,
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing.m
        : theme.spacing.s,
      paddingTop: responsive.isTablet ? responsive.spacing.s : theme.spacing.s,
      paddingBottom: responsive.isTablet
        ? responsive.spacing.l
        : theme.spacing.m,
    },
    infoSection: {
      borderRadius: theme.roundness * 2,
      padding: responsive.isTablet ? responsive.spacing.s : theme.spacing.s,
      marginBottom: responsive.isTablet
        ? responsive.spacing.s
        : theme.spacing.s,
      backgroundColor: theme.colors.elevation.level1,
      borderWidth: 0,
      elevation: 0,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.isTablet ? responsive.spacing.xs : theme.spacing.xs,
      marginBottom: responsive.isTablet
        ? responsive.spacing.xs
        : theme.spacing.xs,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 14 : 14,
    },
    listItemTitle: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontSize: 14,
    },
    listItemDescription: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
    },
    actionsContainer: {
      gap: responsive.isTablet ? theme.spacing.xs : theme.spacing.xs,
      marginBottom: responsive.isTablet ? theme.spacing.m : theme.spacing.m,
      marginTop: responsive.isTablet ? theme.spacing.s : theme.spacing.s,
      paddingHorizontal: 0,
    },
    actionButton: {
      borderRadius: theme.roundness * 2,
      elevation: 0,
      height: responsive.isTablet ? 36 : 40,
    },
    buttonContent: {
      height: responsive.isTablet ? 36 : 40,
      paddingTop: 0,
      paddingBottom: 0,
    },
    buttonLabel: {
      fontSize: responsive.isTablet ? 13 : 14,
      lineHeight: responsive.isTablet ? 18 : 20,
      marginVertical: responsive.isTablet ? 6 : 8,
      includeFontPadding: false,
    },
    deleteButton: {
      borderColor: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    compactRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: responsive.isTablet ? responsive.spacing.s : theme.spacing.s,
      paddingVertical: responsive.isTablet
        ? responsive.spacing.xs
        : theme.spacing.xs,
    },
    compactContent: {
      flex: 1,
    },
    compactLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 11 : 11,
      lineHeight: responsive.isTablet ? 14 : 14,
    },
    compactValue: {
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 13 : 13,
      fontWeight: '500',
      lineHeight: responsive.isTablet ? 16 : 16,
    },
  });
