import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Portal,
  Modal,
  Text,
  Surface,
  IconButton,
  Chip,
  Avatar,
  Divider,
  Button,
  Dialog,
  TextInput,
  HelperText,
  Icon,
  List,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
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
  const styles = getStyles(theme);
  
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
      case 'male': return 'Masculino';
      case 'female': return 'Femenino';
      case 'other': return 'Otro';
      default: return 'No especificado';
    }
  };

  const getRoleInfo = (roleId?: number) => {
    switch (roleId) {
      case 1:
        return { label: 'Administrador', icon: 'shield-account', color: theme.colors.error };
      case 2:
        return { label: 'Gerente', icon: 'account-tie', color: theme.colors.primary };
      case 3:
        return { label: 'Cajero', icon: 'cash-register', color: theme.colors.tertiary };
      case 4:
        return { label: 'Mesero', icon: 'room-service', color: theme.colors.secondary };
      case 5:
        return { label: 'Cocina', icon: 'chef-hat', color: '#FF6B6B' };
      case 6:
        return { label: 'Repartidor', icon: 'moped', color: '#4ECDC4' };
      default:
        return { label: 'Sin rol', icon: 'account', color: theme.colors.onSurfaceVariant };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent} elevation={5}>
            {/* Header */}
            <View style={[styles.headerContainer, { backgroundColor: theme.colors.elevation.level2 }]}>
              <View style={styles.headerContent}>
                <View style={styles.headerNameRow}>
                  <Text style={[styles.modalTitle, { color: theme.colors.onSurface }]} variant="titleMedium">
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                  </Text>
                  <Chip
                    mode="flat"
                    icon={getRoleInfo(user.role?.id).icon}
                    style={[
                      styles.headerRoleChip,
                      { backgroundColor: theme.colors.surface }
                    ]}
                    textStyle={[
                      styles.headerRoleChipText,
                      { color: getRoleInfo(user.role?.id).color }
                    ]}
                    compact
                  >
                    {getRoleInfo(user.role?.id).label}
                  </Chip>
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.colors.onSurfaceVariant }]} variant="bodySmall">
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

            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              {/* Contact Information */}
              <Surface style={styles.infoSection} elevation={1}>
                <View style={styles.sectionHeader}>
                  <Icon source="contacts" size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información de Contacto
                  </Text>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source="email" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Email</Text>
                    <Text style={styles.compactValue} variant="bodySmall">{user.email || 'No especificado'}</Text>
                  </View>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source="phone" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Teléfono</Text>
                    <Text style={styles.compactValue} variant="bodySmall">{user.phoneNumber || 'No especificado'}</Text>
                  </View>
                </View>
              </Surface>

              {/* Personal Information */}
              <Surface style={styles.infoSection} elevation={1}>
                <View style={styles.sectionHeader}>
                  <Icon source="account-details" size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Información Personal
                  </Text>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source="account" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Nombre completo</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {`${user.firstName || 'No especificado'} ${user.lastName || 'No especificado'}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="gender-transgender" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Género</Text>
                    <Text style={styles.compactValue} variant="bodySmall">{getGenderLabel(user.gender)}</Text>
                  </View>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source="cake-variant" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Fecha de nacimiento</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.birthDate ? new Date(user.birthDate).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'No especificado'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source={user.isActive ? "check-circle-outline" : "close-circle-outline"} 
                    size={18} 
                    color={user.isActive ? theme.colors.primary : theme.colors.error} 
                  />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Estado de la cuenta</Text>
                    <Text style={[styles.compactValue, { 
                      color: user.isActive ? theme.colors.primary : theme.colors.error 
                    }]} variant="bodySmall">
                      {user.isActive ? 'Activa' : 'Inactiva'}
                    </Text>
                  </View>
                </View>
              </Surface>

              {/* Address Information */}
              <Surface style={styles.infoSection} elevation={1}>
                <View style={styles.sectionHeader}>
                  <Icon source="map-marker" size={20} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Dirección
                  </Text>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source="home" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Dirección</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.address || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="city" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Ciudad</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.city || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="map" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Estado/Provincia</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.state || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="earth" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">País</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.country || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="mailbox" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Código Postal</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.zipCode || 'No especificado'}
                    </Text>
                  </View>
                </View>
              </Surface>

              {/* Emergency Contact */}
              <Surface style={styles.infoSection} elevation={1}>
                <View style={styles.sectionHeader}>
                  <Icon source="alert-circle" size={20} color={theme.colors.error} />
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Contacto de Emergencia
                  </Text>
                </View>
                
                <View style={styles.compactRow}>
                  <Icon source="account-alert" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Nombre</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.emergencyContact?.name || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="phone-alert" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Teléfono</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.emergencyContact?.phone || 'No especificado'}
                    </Text>
                  </View>
                </View>

                <View style={styles.compactRow}>
                  <Icon source="account-multiple" size={18} color={theme.colors.primary} />
                  <View style={styles.compactContent}>
                    <Text style={styles.compactLabel} variant="labelSmall">Relación</Text>
                    <Text style={styles.compactValue} variant="bodySmall">
                      {user.emergencyContact?.relationship || 'No especificado'}
                    </Text>
                  </View>
                </View>
              </Surface>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                <Button
                  mode="contained-tonal"
                  onPress={() => onEdit(user)}
                  icon="pencil"
                  style={styles.actionButton}
                >
                  Editar Usuario
                </Button>
                
                <Button
                  mode="contained-tonal"
                  onPress={() => setShowPasswordDialog(true)}
                  icon="lock-reset"
                  style={styles.actionButton}
                  buttonColor={theme.colors.secondaryContainer}
                >
                  Cambiar Contraseña
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={() => setShowDeleteDialog(true)}
                  icon="delete"
                  style={[styles.actionButton, styles.deleteButton]}
                  textColor={theme.colors.error}
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
          }}
        >
          <Dialog.Title>Cambiar Contraseña</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: theme.spacing.m }}>
              Ingresa la nueva contraseña para el usuario {user.username}
            </Text>
            
            <TextInput
              label="Nueva contraseña"
              value={newPassword}
              onChangeText={setNewPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={{ marginBottom: theme.spacing.s }}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {newPassword.length > 0 && newPassword.length < 6 && (
              <HelperText type="error" visible>
                La contraseña debe tener al menos 6 caracteres
              </HelperText>
            )}
            
            <TextInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={{ marginBottom: theme.spacing.s }}
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <HelperText type="error" visible>
                Las contraseñas no coinciden
              </HelperText>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowPasswordDialog(false);
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onPress={handleResetPassword}
              loading={resetPasswordMutation.isPending}
              disabled={
                resetPasswordMutation.isPending ||
                newPassword.length < 6 ||
                newPassword !== confirmPassword
              }
            >
              Cambiar
            </Button>
          </Dialog.Actions>
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
            <Button onPress={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
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

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      margin: 20,
    },
    modalContent: {
      borderRadius: theme.roundness * 3,
      backgroundColor: theme.colors.surface,
      maxHeight: '90%',
      overflow: 'hidden',
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
    },
    modalSubtitle: {
      marginTop: 2,
    },
    headerRoleChip: {
      height: 26,
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingHorizontal: theme.spacing.xs,
    },
    headerRoleChipText: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 14,
    },
    contentContainer: {
      maxHeight: 500,
      paddingHorizontal: theme.spacing.s,
      paddingTop: theme.spacing.s,
    },
    infoSection: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.s,
      marginBottom: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 14,
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
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.m,
      marginTop: theme.spacing.s,
    },
    actionButton: {
      borderRadius: theme.roundness * 2,
      elevation: 0,
      height: 40,
    },
    deleteButton: {
      borderColor: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
    compactRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
    },
    compactContent: {
      flex: 1,
    },
    compactLabel: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 11,
      lineHeight: 14,
    },
    compactValue: {
      color: theme.colors.onSurface,
      fontSize: 13,
      fontWeight: '500',
      lineHeight: 16,
    },
  });