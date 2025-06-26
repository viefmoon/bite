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
import { useToggleUserActive, useResetPassword, useDeleteUser } from '../hooks';
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
  
  const toggleActiveMutation = useToggleUserActive();
  const resetPasswordMutation = useResetPassword();
  const deleteUserMutation = useDeleteUser();

  const handleToggleActive = async () => {
    try {
      await toggleActiveMutation.mutateAsync({
        id: user.id,
        isActive: !user.isActive,
      });
    } catch (error) {
      // Error handled in mutation
    }
  };

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
      case 'MALE': return 'Masculino';
      case 'FEMALE': return 'Femenino';
      case 'OTHER': return 'Otro';
      case 'PREFER_NOT_TO_SAY': return 'Prefiero no decir';
      default: return 'No especificado';
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
            <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary }]}>
              <View style={styles.headerLeft}>
                <Avatar.Icon
                  size={40}
                  icon="account"
                  style={[styles.headerIcon, { backgroundColor: theme.colors.onPrimary + '20' }]}
                  color={theme.colors.onPrimary}
                />
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.modalTitle, { color: theme.colors.onPrimary }]} variant="titleLarge">
                    {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.colors.onPrimary + 'CC' }]} variant="bodyMedium">
                    @{user.username}
                  </Text>
                </View>
              </View>
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
                iconColor={theme.colors.onPrimary}
              />
            </View>

            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
              {/* Status and Role */}
              <View style={styles.statusContainer}>
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    { backgroundColor: user.isActive ? theme.colors.successContainer : theme.colors.errorContainer }
                  ]}
                  textStyle={{ color: user.isActive ? theme.colors.onSuccessContainer : theme.colors.onErrorContainer }}
                >
                  {user.isActive ? 'Activo' : 'Inactivo'}
                </Chip>
                <Chip
                  mode="flat"
                  style={[
                    styles.roleChip,
                    { backgroundColor: user.role?.id === 1 ? theme.colors.tertiaryContainer : theme.colors.secondaryContainer }
                  ]}
                  textStyle={{ 
                    color: user.role?.id === 1 ? theme.colors.onTertiaryContainer : theme.colors.onSecondaryContainer 
                  }}
                  icon={user.role?.id === 1 ? 'shield-account' : 'account'}
                >
                  {user.role?.name || 'Sin rol'}
                </Chip>
              </View>

              {/* Contact Information */}
              <Surface style={styles.infoSection} elevation={1}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Información de Contacto
                </Text>
                
                <List.Item
                  title={user.email || 'No especificado'}
                  description="Email"
                  left={(props) => <List.Icon {...props} icon="email" color={theme.colors.primary} />}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                />
                
                <List.Item
                  title={user.phoneNumber || 'No especificado'}
                  description="Teléfono"
                  left={(props) => <List.Icon {...props} icon="phone" color={theme.colors.primary} />}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                />
              </Surface>

              {/* Personal Information */}
              <Surface style={styles.infoSection} elevation={1}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Información Personal
                </Text>
                
                <List.Item
                  title={getGenderLabel(user.gender)}
                  description="Género"
                  left={(props) => <List.Icon {...props} icon="gender-transgender" color={theme.colors.primary} />}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                />
                
                {user.birthDate && (
                  <List.Item
                    title={new Date(user.birthDate).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    description="Fecha de nacimiento"
                    left={(props) => <List.Icon {...props} icon="cake-variant" color={theme.colors.primary} />}
                    titleStyle={styles.listItemTitle}
                    descriptionStyle={styles.listItemDescription}
                  />
                )}
              </Surface>

              {/* Address Information */}
              {(user.address || user.city || user.state || user.country || user.zipCode) && (
                <Surface style={styles.infoSection} elevation={1}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Dirección
                  </Text>
                  
                  <View style={styles.addressContainer}>
                    <Icon source="map-marker" size={24} color={theme.colors.primary} />
                    <View style={styles.addressContent}>
                      {user.address && (
                        <Text style={styles.addressLine} variant="bodyMedium">
                          {user.address}
                        </Text>
                      )}
                      {(user.city || user.state || user.zipCode) && (
                        <Text style={styles.addressLine} variant="bodyMedium">
                          {[user.city, user.state, user.zipCode].filter(Boolean).join(', ')}
                        </Text>
                      )}
                      {user.country && (
                        <Text style={styles.addressLine} variant="bodyMedium">
                          {user.country}
                        </Text>
                      )}
                    </View>
                  </View>
                </Surface>
              )}

              {/* Emergency Contact */}
              {user.emergencyContact && (
                <Surface style={styles.infoSection} elevation={1}>
                  <Text style={styles.sectionTitle} variant="titleMedium">
                    Contacto de Emergencia
                  </Text>
                  
                  <View style={styles.emergencyContainer}>
                    <Icon source="alert-circle" size={24} color={theme.colors.error} />
                    <View style={styles.emergencyContent}>
                      {user.emergencyContact.name && (
                        <Text style={styles.emergencyText} variant="bodyMedium">
                          <Text style={styles.emergencyLabel}>Nombre:</Text> {user.emergencyContact.name}
                        </Text>
                      )}
                      {user.emergencyContact.phone && (
                        <Text style={styles.emergencyText} variant="bodyMedium">
                          <Text style={styles.emergencyLabel}>Teléfono:</Text> {user.emergencyContact.phone}
                        </Text>
                      )}
                      {user.emergencyContact.relationship && (
                        <Text style={styles.emergencyText} variant="bodyMedium">
                          <Text style={styles.emergencyLabel}>Relación:</Text> {user.emergencyContact.relationship}
                        </Text>
                      )}
                    </View>
                  </View>
                </Surface>
              )}

              {/* System Information */}
              <Surface style={styles.infoSection} elevation={1}>
                <Text style={styles.sectionTitle} variant="titleMedium">
                  Información del Sistema
                </Text>
                
                <List.Item
                  title={user.id}
                  description="ID del usuario"
                  left={(props) => <List.Icon {...props} icon="identifier" color={theme.colors.primary} />}
                  titleStyle={[styles.listItemTitle, { fontFamily: 'monospace' }]}
                  descriptionStyle={styles.listItemDescription}
                />
                
                <List.Item
                  title={formatDate(user.createdAt)}
                  description="Fecha de creación"
                  left={(props) => <List.Icon {...props} icon="calendar-plus" color={theme.colors.primary} />}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                />
                
                <List.Item
                  title={formatDate(user.updatedAt)}
                  description="Última actualización"
                  left={(props) => <List.Icon {...props} icon="calendar-edit" color={theme.colors.primary} />}
                  titleStyle={styles.listItemTitle}
                  descriptionStyle={styles.listItemDescription}
                />
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
                  onPress={handleToggleActive}
                  loading={toggleActiveMutation.isPending}
                  disabled={toggleActiveMutation.isPending}
                  icon={user.isActive ? 'account-off' : 'account-check'}
                  style={styles.actionButton}
                  buttonColor={user.isActive ? theme.colors.errorContainer : theme.colors.successContainer}
                  textColor={user.isActive ? theme.colors.onErrorContainer : theme.colors.onSuccessContainer}
                >
                  {user.isActive ? 'Desactivar' : 'Activar'}
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
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
      borderTopLeftRadius: theme.roundness * 3,
      borderTopRightRadius: theme.roundness * 3,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerIcon: {
      marginRight: theme.spacing.m,
    },
    headerTextContainer: {
      flex: 1,
    },
    modalTitle: {
      fontWeight: '700',
    },
    modalSubtitle: {
      marginTop: 2,
    },
    contentContainer: {
      maxHeight: 500,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
    },
    statusContainer: {
      flexDirection: 'row',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.m,
    },
    statusChip: {
      borderRadius: theme.roundness * 2,
    },
    roleChip: {
      borderRadius: theme.roundness * 2,
    },
    infoSection: {
      borderRadius: theme.roundness * 2,
      padding: theme.spacing.m,
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
    },
    sectionTitle: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.m,
    },
    listItemTitle: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    listItemDescription: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 12,
    },
    addressContainer: {
      flexDirection: 'row',
      gap: theme.spacing.m,
    },
    addressContent: {
      flex: 1,
    },
    addressLine: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    emergencyContainer: {
      flexDirection: 'row',
      gap: theme.spacing.m,
    },
    emergencyContent: {
      flex: 1,
    },
    emergencyText: {
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
    },
    emergencyLabel: {
      fontWeight: '600',
    },
    actionsContainer: {
      gap: theme.spacing.s,
      marginBottom: theme.spacing.l,
    },
    actionButton: {
      borderRadius: theme.roundness * 2,
    },
    deleteButton: {
      borderColor: theme.colors.error,
    },
  });