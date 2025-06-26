import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal } from 'react-native-paper';
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
    parts.push(`@${user.username}`);
    if (user.role?.name) parts.push(`• ${user.role.name}`);
    return parts.join(' ');
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContainer: {
      flex: 1,
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