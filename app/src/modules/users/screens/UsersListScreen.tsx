import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, Chip, Text } from 'react-native-paper';
import { useDrawerStatus } from '@react-navigation/drawer';
import GenericList from '@/app/components/crud/GenericList';
import { UserFormModal } from '../components/UserFormModal';
import { UserDetailModal } from '../components/UserDetailModal';
import { useListState } from '@/app/hooks/useListState';
import { useCrudScreenLogic } from '@/app/hooks/useCrudScreenLogic';
import { useAppTheme } from '@/app/styles/theme';
import { useGetUsers, useDeleteUser } from '../hooks';
import type { User, UsersQuery } from '../types';
import { RoleEnum } from '../types';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';

export function UsersListScreen() {
  const theme = useAppTheme();
  const drawerStatus = useDrawerStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deleteUserMutation = useDeleteUser();

  const {
    isFormModalVisible,
    isDetailModalVisible,
    selectedItem,
    editingItem,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseModals,
  } = useCrudScreenLogic<User>({
    entityName: 'Usuario',
    queryKey: ['users'],
    deleteMutationFn: async (id) => {
      await deleteUserMutation.mutateAsync(id);
    },
  });

  const queryParams: UsersQuery = {
    page: 1,
    limit: 100,
    search: searchQuery || undefined,
    filters:
      selectedFilter === 'all'
        ? undefined
        : selectedFilter === 'active'
          ? { isActive: true }
          : selectedFilter === 'inactive'
            ? { isActive: false }
            : selectedFilter === 'admin'
              ? { roles: [{ id: RoleEnum.ADMIN }] }
              : selectedFilter === 'user'
                ? { roles: [{ id: RoleEnum.WAITER }] }
                : undefined,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  };

  const { data, isLoading, error, refetch } = useGetUsers(queryParams);

  // Recargar automáticamente cuando la pantalla recibe foco
  useRefreshModuleOnFocus('users');

  // Funciones auxiliares definidas antes del useMemo
  const getStatusColor = (user: User) => {
    return user.isActive ? 'success' : 'error';
  };

  const getStatusText = (user: User) => {
    return user.isActive ? 'Activo' : 'Inactivo';
  };

  const getUserDescription = (user: User) => {
    const parts = [];

    // Mostrar username primero
    parts.push(`@${user.username}`);

    // Luego el email en una nueva línea si existe
    if (user.email) {
      parts.push(`\n${user.email}`);
    }

    // Si es usuario de cocina y tiene pantalla asignada, mostrarla
    if (user.role?.id === 5 && user.preparationScreen) {
      parts.push(`\nPantalla: ${user.preparationScreen.name}`);
    }

    return parts.join('');
  };

  // Mapear los usuarios para agregar campos calculados
  const mappedUsers = React.useMemo(() => {
    const users = data?.data || [];

    return users.map((user) => {
      const displayName =
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username;
      const displayInfo = getUserDescription(user);

      return {
        ...user,
        displayName,
        displayInfo,
        displayNameWithRole: { name: displayName, roleId: user.role?.id },
        statusText: getStatusText(user),
        statusColor: getStatusColor(user),
      };
    });
  }, [data]);

  const handleCreateUser = () => {
    handleOpenCreateModal();
  };

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError: error ? true : false,
    data: mappedUsers,
    emptyConfig: {
      title: 'No hay usuarios',
      message: 'No hay usuarios registrados en el sistema',
      icon: 'account-multiple-outline',
      actionLabel: 'Agregar usuario',
      onAction: handleCreateUser,
    },
    errorConfig: {
      title: 'Error al cargar usuarios',
      message: 'No se pudieron cargar los usuarios. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetch,
    },
  });

  const filterOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Administradores', value: 'admin' },
    { label: 'Usuarios', value: 'user' },
  ];

  const handleEditUser = (user: User) => {
    handleOpenEditModal(user);
  };

  const handleViewUser = (user: User) => {
    handleOpenDetailModal(user);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getRoleChipProps = (roleId: number | undefined) => {
    switch (roleId) {
      case 1:
        return {
          label: 'Admin',
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
          label: 'Usuario',
          icon: 'account',
          color: theme.colors.onSurfaceVariant,
        };
    }
  };

  const renderDescription = (user: User) => {
    const roleProps = getRoleChipProps(user.role?.id);

    return (
      <View style={styles.descriptionContainer}>
        <View style={styles.userInfoRow}>
          <Text style={styles.username}>@{user.username}</Text>
          <Chip
            mode="flat"
            icon={roleProps.icon}
            style={[
              styles.roleChipInDescription,
              { backgroundColor: roleProps.color + '20' },
            ]}
            textStyle={[styles.roleChipText, { color: roleProps.color }]}
            compact
          >
            {roleProps.label}
          </Chip>
        </View>
        {user.email && (
          <Text style={styles.email} numberOfLines={1}>
            {user.email}
          </Text>
        )}
        {user.role?.id === 5 && user.preparationScreen && (
          <Text style={styles.screenInfo}>
            Pantalla: {user.preparationScreen.name}
          </Text>
        )}
      </View>
    );
  };

  const renderTitle = (user: User) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const displayName = fullName || user.username;

    return (
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {displayName}
        </Text>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContainer: {
      flex: 1,
    },
    titleContainer: {
      flex: 1,
      paddingRight: theme.spacing.s,
    },
    title: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: 16,
      lineHeight: 22,
    },
    descriptionContainer: {
      flex: 1,
      gap: theme.spacing.xs / 2,
      paddingTop: theme.spacing.xs / 2,
    },
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      flexWrap: 'wrap',
    },
    username: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    },
    email: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      opacity: 0.8,
    },
    screenInfo: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    roleChipInDescription: {
      height: 28,
      borderRadius: theme.roundness * 2,
      paddingHorizontal: theme.spacing.s,
    },
    roleChipText: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 16,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.container}>
        <GenericList
          items={mappedUsers}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onItemPress={handleViewUser}
          ListEmptyComponent={ListEmptyComponent}
          renderConfig={{
            titleField: 'displayName' as any,
            descriptionField: 'displayInfo' as any,
            statusConfig: {
              field: 'isActive' as any,
              activeValue: true,
              activeLabel: 'Activo',
              inactiveLabel: 'Inactivo',
            },
            renderTitle: renderTitle,
            renderDescription: renderDescription,
          }}
          enableSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por nombre, email o usuario..."
          filterOptions={filterOptions}
          filterValue={selectedFilter}
          onFilterChange={(value) => setSelectedFilter(value as string)}
          showFab={true}
          onFabPress={handleCreateUser}
          fabIcon="account-plus"
          fabLabel="Nuevo Usuario"
          fabVisible={drawerStatus === 'closed'}
          showImagePlaceholder={false}
          isDrawerOpen={drawerStatus === 'open'}
        />
      </View>

      <Portal>
        {isFormModalVisible && (
          <UserFormModal
            visible={isFormModalVisible}
            onDismiss={handleCloseModals}
            user={editingItem}
          />
        )}

        {isDetailModalVisible && selectedItem && (
          <UserDetailModal
            visible={isDetailModalVisible}
            onDismiss={handleCloseModals}
            user={selectedItem}
            onEdit={handleEditUser}
          />
        )}
      </Portal>
    </SafeAreaView>
  );
}
