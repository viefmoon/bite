import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  TextInput,
  Switch,
  HelperText,
  ActivityIndicator,
  Chip,
  List,
  Divider,
  Searchbar,
} from 'react-native-paper';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');

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
    setShowUserModal(false);
    setUserSearchQuery('');
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setValue('userId', '');
  };

  // Filtrar usuarios según búsqueda y disponibilidad
  const filteredUsers = React.useMemo(() => {
    const searchLower = userSearchQuery.toLowerCase();
    return allUsers.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const matchesSearch = !userSearchQuery || 
        fullName.toLowerCase().includes(searchLower) ||
        user.username.toLowerCase().includes(searchLower);
      return matchesSearch;
    });
  }, [allUsers, userSearchQuery]);

  const isSubmitting = createScreen.isPending || updateScreen.isPending;

  // Función auxiliar para obtener el nombre del rol
  const getRoleName = (roleId?: number) => {
    switch (roleId) {
      case RoleEnum.KITCHEN: return 'Cocina';
      case RoleEnum.ADMIN: return 'Admin';
      case RoleEnum.MANAGER: return 'Gerente';
      case RoleEnum.CASHIER: return 'Cajero';
      case RoleEnum.WAITER: return 'Mesero';
      case RoleEnum.DELIVERY: return 'Repartidor';
      default: return 'Sin rol';
    }
  };

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title={isEditing ? 'Editar Pantalla de Preparación' : 'Crear Nueva Pantalla'}
        dismissable={!isSubmitting}
        showCloseButton={!isSubmitting}
        actions={[
          {
            label: 'Cancelar',
            mode: 'outlined' as const,
            onPress: onDismiss,
            disabled: isSubmitting,
          },
          {
            label: isEditing ? 'Actualizar' : 'Crear',
            mode: 'contained' as const,
            onPress: handleSubmit(onSubmit),
            loading: isSubmitting,
            disabled: isSubmitting,
            colorPreset: 'primary' as const,
          },
        ]}
      >
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
                        onPress={() => {
                          if (!isSubmitting && !isLoadingUsers) {
                            setShowUserModal(true);
                          }
                        }}
                        showSoftInputOnFocus={false}
                        editable={false}
                        right={
                          selectedUser ? (
                            <TextInput.Icon
                              icon="close"
                              onPress={handleClearUser}
                              disabled={isSubmitting}
                            />
                          ) : isLoadingUsers ? (
                            <TextInput.Icon
                              icon={() => <ActivityIndicator size="small" />}
                              disabled
                            />
                          ) : (
                            <TextInput.Icon
                              icon="account-search"
                              disabled={isSubmitting}
                              onPress={() => {
                                if (!isSubmitting && !isLoadingUsers) {
                                  setShowUserModal(true);
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
                      {!errors.userId && !selectedUser && (
                        <HelperText type="info" visible={true}>
                          Solo usuarios con rol de cocina pueden ser asignados
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
      </ResponsiveModal>

      {/* Modal de selección de usuario */}
      <ResponsiveModal
        visible={showUserModal}
        onDismiss={() => {
          setShowUserModal(false);
          setUserSearchQuery('');
        }}
        title="Seleccionar Usuario"
        maxHeightPercent={75}
        maxWidthPercent={85}
      >
        <View style={styles.userModalContent}>
          <Searchbar
            placeholder="Buscar por nombre o usuario..."
            onChangeText={setUserSearchQuery}
            value={userSearchQuery}
            style={styles.searchBar}
            mode="bar"
            icon="magnify"
            clearIcon="close"
          />

          {isLoadingUsers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                {userSearchQuery ? 'Sin resultados' : 'No hay usuarios disponibles'}
              </Text>
              <Text style={styles.emptyText}>
                {userSearchQuery 
                  ? `No se encontraron usuarios para "${userSearchQuery}"`
                  : 'No hay usuarios con rol de cocina disponibles'}
              </Text>
            </View>
          ) : (
            <View style={styles.userList}>
              {filteredUsers.map((user) => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                const displayName = fullName || user.username;
                const isKitchenUser = user.role?.id === RoleEnum.KITCHEN;
                const assignedScreen = userAssignments.get(user.id);
                const isAssigned = !!assignedScreen;
                const isSelectable = isKitchenUser && !isAssigned;

                return (
                  <React.Fragment key={user.id}>
                    <List.Item
                      title={displayName}
                      description={
                        <View style={styles.userDescription}>
                          <Text variant="bodySmall">
                            @{user.username} • {getRoleName(user.role?.id)}
                          </Text>
                          {isAssigned && (
                            <Chip 
                              compact 
                              mode="flat" 
                              style={styles.assignedChip}
                              icon="monitor"
                            >
                              {assignedScreen}
                            </Chip>
                          )}
                        </View>
                      }
                      onPress={isSelectable ? () => handleUserSelect(user) : undefined}
                      left={(props) => (
                        <List.Icon 
                          {...props} 
                          icon={isKitchenUser ? "chef-hat" : "account"}
                          color={isSelectable ? theme.colors.primary : theme.colors.onSurfaceDisabled}
                        />
                      )}
                      right={(props) => 
                        isSelectable ? (
                          <List.Icon {...props} icon="chevron-right" />
                        ) : null
                      }
                      style={[
                        styles.userListItem,
                        !isSelectable && styles.disabledUserItem
                      ]}
                      disabled={!isSelectable}
                    />
                    <Divider />
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>
      </ResponsiveModal>
    </>
  );
};

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    form: {
      paddingTop: theme.spacing.m,
    },
    field: {
      marginBottom: theme.spacing.m,
    },
    switchField: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    // Estilos del modal de usuarios
    userModalContent: {
      flex: 1,
    },
    searchBar: {
      marginBottom: theme.spacing.m,
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    loadingText: {
      marginTop: theme.spacing.m,
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyTitle: {
      marginBottom: theme.spacing.s,
      color: theme.colors.onSurfaceVariant,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    userList: {
      flex: 1,
    },
    userListItem: {
      paddingVertical: theme.spacing.m,
    },
    disabledUserItem: {
      backgroundColor: theme.colors.surfaceDisabled,
      opacity: 0.7,
    },
    userDescription: {
      marginTop: theme.spacing.xs,
    },
    assignedChip: {
      marginTop: theme.spacing.xs,
      backgroundColor: theme.colors.errorContainer,
    },
  });

export default PreparationScreenFormModal;
