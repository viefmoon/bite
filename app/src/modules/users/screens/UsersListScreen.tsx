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
    handleDeleteItem,
  } = useCrudScreenLogic<User>({
    entityName: 'Usuario',
    queryKey: ['users'],
    deleteMutationFn: (id) => deleteUserMutation.mutateAsync(id),
  });

  const queryParams: UsersQuery = {
    page: 1,
    limit: 100,
    search: searchQuery || undefined,
    filters: selectedFilter === 'all' 
      ? undefined 
      : selectedFilter === 'active'
        ? { isActive: true }
        : selectedFilter === 'inactive'
          ? { isActive: false }
          : selectedFilter === 'admin'
            ? { role: RoleEnum.ADMIN }
            : selectedFilter === 'user'
              ? { role: RoleEnum.USER }
              : undefined,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  };

  const { data, isLoading, error, refetch } = useGetUsers(queryParams);

  // Funciones auxiliares definidas antes del useMemo
  const getStatusColor = (user: User) => {
    return user.isActive ? 'success' : 'error';
  };

  const getStatusText = (user: User) => {
    return user.isActive ? 'Activo' : 'Inactivo';
  };

  const getUserDescription = (user: User) => {
    const parts = [];
    if (user.email) parts.push(user.email);
    parts.push(user.username);
    // Removed role from description as it will be shown as a chip
    return parts.join(' • ');
  };

  // Mapear los usuarios para agregar campos calculados
  const mappedUsers = React.useMemo(() => {
    const users = data?.data || [];
    
    return users.map(user => {
      const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
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
  });

  const filterOptions = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Administradores', value: 'admin' },
    { label: 'Usuarios', value: 'user' },
  ];

  const handleCreateUser = () => {
    handleOpenCreateModal();
  };

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
        return { label: 'Admin', icon: 'shield-account', color: theme.colors.error };
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
        return { label: 'Usuario', icon: 'account', color: theme.colors.onSurfaceVariant };
    }
  };

  const renderTitle = (user: User) => {
    const roleProps = getRoleChipProps(user.role?.id);
    const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
    
    return (
      <View style={styles.titleContainer}>
        <Text variant="titleMedium" style={styles.title} numberOfLines={1}>
          {displayName}
        </Text>
        <Chip
          mode="flat"
          icon={roleProps.icon}
          style={[
            styles.roleChip,
            { backgroundColor: roleProps.color + '15' }
          ]}
          textStyle={[
            styles.roleChipText,
            { color: roleProps.color }
          ]}
          compact
        >
          {roleProps.label}
        </Chip>
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    title: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 0,
      flexShrink: 1,
    },
    roleChip: {
      height: 28,
      borderRadius: theme.roundness * 2,
      marginLeft: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
    },
    roleChipText: {
      fontSize: 13,
      fontWeight: '500',
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
          }}
          enableSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Buscar por nombre, email o usuario..."
          filterOptions={filterOptions}
          filterValue={selectedFilter}
          onFilterChange={setSelectedFilter}
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