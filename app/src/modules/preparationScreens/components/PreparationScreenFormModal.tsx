import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Switch,
  HelperText,
  Surface,
  List,
  Divider,
  IconButton,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { User, RoleEnum } from '@/modules/users/types/user.types';
import { useGetUsers } from '@/modules/users/hooks/useUsers';
import {
  PreparationScreen,
  CreatePreparationScreenDto,
  UpdatePreparationScreenDto,
  CreatePreparationScreenSchema,
  UpdatePreparationScreenSchema,
} from '../schema/preparationScreen.schema';
import {
  useCreatePreparationScreen,
  useUpdatePreparationScreen,
} from '../hooks/usePreparationScreensQueries';

interface PreparationScreenFormModalProps {
  visible: boolean;
  onDismiss: () => void;
  editingItem: PreparationScreen | null;
  onSubmitSuccess?: () => void;
}

type FormData = CreatePreparationScreenDto | UpdatePreparationScreenDto;

const PreparationScreenFormModal: React.FC<PreparationScreenFormModalProps> = ({
  visible,
  onDismiss,
  editingItem,
  onSubmitSuccess,
}) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const isEditing = !!editingItem;
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Obtener todos los usuarios activos
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsers({
    filters: {
      isActive: true,
    },
  });

  // Todos los usuarios, ordenados con los de cocina primero
  const allUsers = (usersData?.data || []).sort((a, b) => {
    const aIsKitchen = a.role?.id === RoleEnum.KITCHEN;
    const bIsKitchen = b.role?.id === RoleEnum.KITCHEN;
    if (aIsKitchen && !bIsKitchen) return -1;
    if (!aIsKitchen && bIsKitchen) return 1;
    return 0;
  });

  // Hooks de mutación
  const createScreen = useCreatePreparationScreen();
  const updateScreen = useUpdatePreparationScreen();

  // Configuración del formulario
  const formSchema = isEditing
    ? UpdatePreparationScreenSchema
    : CreatePreparationScreenSchema;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: undefined,
      isActive: true,
      userId: '',
    },
  });

  // Efecto para cargar datos al editar
  useEffect(() => {
    if (editingItem) {
      reset({
        name: editingItem.name,
        description: editingItem.description ?? undefined,
        isActive: editingItem.isActive,
        userId:
          editingItem.users && editingItem.users.length > 0
            ? editingItem.users[0].id
            : undefined,
      });
      setSelectedUser(
        editingItem.users && editingItem.users.length > 0
          ? (editingItem.users[0] as User)
          : null,
      );
    } else {
      reset({
        name: '',
        description: undefined,
        isActive: true,
        userId: '',
      });
      setSelectedUser(null);
    }
  }, [editingItem, reset]);

  // Manejo del envío del formulario
  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing && editingItem) {
        await updateScreen.mutateAsync({
          id: editingItem.id,
          data: data as UpdatePreparationScreenDto,
        });
      } else {
        await createScreen.mutateAsync(data as CreatePreparationScreenDto);
      }
      onSubmitSuccess?.();
      onDismiss();
    } catch (error) {}
  };

  // Manejo de selección de usuario
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setValue('userId', user.id);
    setShowUserDropdown(false);
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setValue('userId', '');
  };

  const isSubmitting = createScreen.isPending || updateScreen.isPending;

  // Funciones auxiliares para roles
  const getRoleLabel = (roleId?: number) => {
    switch (roleId) {
      case RoleEnum.ADMIN:
        return 'Administrador';
      case RoleEnum.MANAGER:
        return 'Gerente';
      case RoleEnum.CASHIER:
        return 'Cajero';
      case RoleEnum.WAITER:
        return 'Mesero';
      case RoleEnum.KITCHEN:
        return 'Cocina';
      case RoleEnum.DELIVERY:
        return 'Repartidor';
      default:
        return 'Sin rol';
    }
  };

  const getIconForRole = (roleId?: number) => {
    switch (roleId) {
      case RoleEnum.ADMIN:
        return 'shield-account';
      case RoleEnum.MANAGER:
        return 'account-tie';
      case RoleEnum.CASHIER:
        return 'cash-register';
      case RoleEnum.WAITER:
        return 'room-service';
      case RoleEnum.KITCHEN:
        return 'chef-hat';
      case RoleEnum.DELIVERY:
        return 'moped';
      default:
        return 'account';
    }
  };

  return (
    <>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Surface style={styles.surface}>
              <Text variant="headlineSmall" style={styles.title}>
                {isEditing
                  ? 'Editar Pantalla de Preparación'
                  : 'Crear Nueva Pantalla'}
              </Text>

              <View style={styles.form}>
                {/* Campo Nombre */}
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.field}>
                      <TextInput
                        label="Nombre de la Pantalla *"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.name}
                        disabled={isSubmitting}
                        placeholder="Ej: Cocina Principal, Barra Fría"
                        mode="outlined"
                      />
                      {errors.name && (
                        <HelperText type="error" visible={!!errors.name}>
                          {errors.name.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

                {/* Campo Descripción */}
                <Controller
                  control={control}
                  name="description"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View style={styles.field}>
                      <TextInput
                        label="Descripción (Opcional)"
                        value={value || ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.description}
                        disabled={isSubmitting}
                        placeholder="Ej: Pantalla para órdenes de cocina caliente"
                        mode="outlined"
                        multiline
                        numberOfLines={3}
                      />
                      {errors.description && (
                        <HelperText type="error" visible={!!errors.description}>
                          {errors.description.message}
                        </HelperText>
                      )}
                    </View>
                  )}
                />

                {/* Campo Usuario */}
                <Controller
                  control={control}
                  name="userId"
                  render={() => (
                    <View style={styles.field}>
                      <TextInput
                        label="Usuario de Cocina *"
                        value={
                          selectedUser
                            ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() ||
                              selectedUser.username
                            : ''
                        }
                        mode="outlined"
                        error={!!errors.userId}
                        disabled={isSubmitting || isLoadingUsers}
                        onPressOut={() => {
                          if (
                            !isSubmitting &&
                            !isLoadingUsers &&
                            allUsers.length > 0
                          ) {
                            setShowUserDropdown(true);
                          }
                        }}
                        showSoftInputOnFocus={false}
                        editable={false}
                        right={
                          selectedUser ? (
                            <TextInput.Icon
                              icon="close"
                              onPress={() => {
                                handleClearUser();
                              }}
                              disabled={isSubmitting}
                            />
                          ) : (
                            <TextInput.Icon
                              icon={isLoadingUsers ? 'loading' : 'chevron-down'}
                              disabled={isSubmitting || isLoadingUsers}
                              onPress={() => {
                                if (!isSubmitting && !isLoadingUsers) {
                                  setShowUserDropdown(true);
                                }
                              }}
                            />
                          )
                        }
                      />
                      {errors.userId && (
                        <HelperText type="error" visible={!!errors.userId}>
                          {errors.userId.message}
                        </HelperText>
                      )}
                      {!errors.userId && (
                        <HelperText type="info" visible={true}>
                          Nota: Un usuario solo puede estar asignado a una
                          pantalla a la vez
                        </HelperText>
                      )}
                    </View>
                  )}
                />

                {/* Campo Activa */}
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.switchField}>
                      <Text variant="bodyLarge">¿Está activa?</Text>
                      <Switch
                        value={value}
                        onValueChange={onChange}
                        disabled={isSubmitting}
                        color={theme.colors.primary}
                      />
                    </View>
                  )}
                />
              </View>

              <View style={styles.actions}>
                <Button mode="text" onPress={onDismiss} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit(onSubmit)}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isEditing ? 'Actualizar' : 'Crear'}
                </Button>
              </View>
            </Surface>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Dropdown de usuarios */}
      <Portal>
        <Modal
          visible={showUserDropdown}
          onDismiss={() => setShowUserDropdown(false)}
          contentContainerStyle={[styles.dropdownModal, { maxHeight: 300 }]}
        >
          <Surface style={styles.dropdownContent}>
            <View style={styles.dropdownHeader}>
              <Text variant="titleMedium" style={styles.dropdownTitle}>
                Seleccionar Usuario de Cocina
              </Text>
              <Text variant="bodySmall" style={styles.dropdownSubtitle}>
                Solo los usuarios con rol de cocina pueden ser seleccionados
              </Text>
            </View>
            <Divider />
            <ScrollView>
              {isLoadingUsers ? (
                <View style={styles.loadingContainer}>
                  <Text>Cargando usuarios...</Text>
                </View>
              ) : allUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text>No hay usuarios disponibles</Text>
                </View>
              ) : (
                allUsers.map((user) => {
                  const displayName =
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.username;
                  const isKitchenUser = user.role?.id === RoleEnum.KITCHEN;
                  const roleLabel = getRoleLabel(user.role?.id);

                  return (
                    <List.Item
                      key={user.id}
                      title={displayName}
                      description={`${user.username !== displayName ? user.username + ' • ' : ''}${roleLabel}`}
                      onPress={
                        isKitchenUser ? () => handleUserSelect(user) : undefined
                      }
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={getIconForRole(user.role?.id)}
                        />
                      )}
                      style={[
                        styles.dropdownItem,
                        !isKitchenUser && styles.disabledDropdownItem,
                      ]}
                      disabled={!isKitchenUser}
                      titleStyle={!isKitchenUser && styles.disabledText}
                      descriptionStyle={!isKitchenUser && styles.disabledText}
                    />
                  );
                })
              )}
            </ScrollView>
          </Surface>
        </Modal>
      </Portal>
    </>
  );
};

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      margin: 20,
    },
    surface: {
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    title: {
      padding: 24,
      paddingBottom: 16,
      color: theme.colors.onSurface,
    },
    form: {
      paddingHorizontal: 24,
    },
    field: {
      marginBottom: 16,
    },
    switchField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingVertical: 8,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      paddingTop: 8,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.surfaceVariant,
    },
    dropdownModal: {
      margin: 20,
      marginTop: '30%',
    },
    dropdownContent: {
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
    },
    dropdownHeader: {
      padding: 16,
      paddingBottom: 12,
    },
    dropdownTitle: {
      marginBottom: 4,
    },
    dropdownSubtitle: {
      color: theme.colors.onSurfaceVariant,
    },
    dropdownItem: {
      paddingHorizontal: 16,
    },
    disabledDropdownItem: {
      opacity: 0.5,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    disabledText: {
      color: theme.colors.onSurfaceDisabled,
    },
    loadingContainer: {
      padding: 20,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: 20,
      alignItems: 'center',
    },
  });

export default PreparationScreenFormModal;
