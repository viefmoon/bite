import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@/app/lib/zodResolver';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { User, RoleEnum } from '@/modules/users/schema/user.schema';
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
  useGetPreparationScreens,
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

  // Obtener todas las pantallas de preparación para verificar usuarios asignados
  const { data: screensData } = useGetPreparationScreens(
    {},
    { page: 1, limit: 100 }, // Obtener todas las pantallas
  );

  // Crear mapa de usuarios asignados a pantallas
  const userAssignments = React.useMemo(() => {
    if (!screensData?.data) return new Map<string, string>();

    const assignments = new Map<string, string>();
    screensData.data.forEach((screen) => {
      // Excluir la pantalla actual al editar
      if (editingItem && screen.id === editingItem.id) return;

      if (screen.users && screen.users.length > 0) {
        screen.users.forEach((user) => {
          assignments.set(user.id, screen.name);
        });
      }
    });
    return assignments;
  }, [screensData, editingItem]);

  // Todos los usuarios, ordenados con los de cocina primero y disponibles al inicio
  const allUsers = React.useMemo(() => {
    if (!usersData?.data) return [];

    return usersData.data.sort((a, b) => {
      // Primero ordenar por disponibilidad
      const aAssigned = userAssignments.has(a.id);
      const bAssigned = userAssignments.has(b.id);
      if (!aAssigned && bAssigned) return -1;
      if (aAssigned && !bAssigned) return 1;

      // Luego por rol de cocina
      const aIsKitchen = a.role?.id === RoleEnum.KITCHEN;
      const bIsKitchen = b.role?.id === RoleEnum.KITCHEN;
      if (aIsKitchen && !bIsKitchen) return -1;
      if (!aIsKitchen && bIsKitchen) return 1;

      return 0;
    });
  }, [usersData, userAssignments]);

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
            : '', // Siempre string vacío para activar validación
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
    } catch (error: any) {
      // No mostrar snackbar aquí porque el hook ya lo hace
      // Solo hacer log para debugging
    }
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
          contentContainerStyle={[
            styles.dropdownModal,
            styles.dropdownModalMaxHeight,
          ]}
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
                  const assignedScreen = userAssignments.get(user.id);
                  const isAssigned = !!assignedScreen;
                  const isSelectable = isKitchenUser && !isAssigned;

                  return (
                    <List.Item
                      key={user.id}
                      title={displayName}
                      description={
                        isAssigned
                          ? `Asignado a: ${assignedScreen}`
                          : `${user.username !== displayName ? user.username + ' • ' : ''}${roleLabel}`
                      }
                      onPress={
                        isSelectable ? () => handleUserSelect(user) : undefined
                      }
                      left={(props) => (
                        <List.Icon
                          {...props}
                          icon={getIconForRole(user.role?.id)}
                          color={
                            isAssigned ? theme.colors.outline : props.color
                          }
                        />
                      )}
                      style={[
                        styles.dropdownItem,
                        !isSelectable && styles.disabledDropdownItem,
                      ]}
                      disabled={!isSelectable}
                      titleStyle={!isSelectable && styles.disabledText}
                      descriptionStyle={[
                        !isSelectable && styles.disabledText,
                        isAssigned && { color: theme.colors.error },
                      ]}
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
    dropdownModalMaxHeight: {
      maxHeight: 300,
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
