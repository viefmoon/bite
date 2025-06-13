import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';
import { debounce } from 'lodash';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../hooks/useCustomersQueries';
import { Customer } from '../types/customer.types';
import { CustomerFormInputs } from '../schema/customer.schema';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import GenericList, { FilterOption } from '@/app/components/crud/GenericList';
import GenericDetailModal from '@/app/components/crud/GenericDetailModal';
import CustomerFormModal from '../components/CustomerFormModal';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useCrudScreenLogic } from '@/app/hooks/useCrudScreenLogic';
import { useListState } from '@/app/hooks/useListState';
import { formatCurrency } from '@/app/lib/formatters';

function CustomersScreen(): JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme as AppTheme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);

  const debouncedSetSearch = useCallback(
    debounce((query: string) => setDebouncedSearchQuery(query), 300),
    [],
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  const handleFilterChange = (value: string | number) => {
    if (value === 'all' || value === 'active' || value === 'inactive') {
      setStatusFilter(value);
    } else {
      setStatusFilter('all');
    }
  };

  const queryFilters = useMemo(
    () => ({
      firstName: debouncedSearchQuery || undefined,
      lastName: debouncedSearchQuery || undefined,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [debouncedSearchQuery, statusFilter],
  );

  const {
    data: customers,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useCustomers(queryFilters);

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const { mutateAsync: deleteCustomer } = useDeleteCustomer();

  const {
    isFormModalVisible,
    editingItem,
    handleOpenCreateModal,
    handleOpenEditModal: originalHandleOpenEditModal,
    handleCloseModals: originalHandleCloseModals,
  } = useCrudScreenLogic<Customer>({
    entityName: 'Cliente',
    queryKey: ['customers', queryFilters],
    deleteMutationFn: deleteCustomer,
  });

  const handleOpenEditModal = useCallback(
    (item: Customer) => {
      setDetailModalVisible(false);
      originalHandleOpenEditModal(item);
    },
    [originalHandleOpenEditModal],
  );

  const handleCloseModals = useCallback(() => {
    originalHandleCloseModals();
    setDetailModalVisible(false);
  }, [originalHandleCloseModals]);

  const handleItemPress = useCallback((item: Customer) => {
    setSelectedCustomer(item);
    setDetailModalVisible(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setCustomerToDelete(id);
      setShowDeleteConfirmation(true);
    },
    [],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!customerToDelete) return;
    
    try {
      await deleteCustomer(customerToDelete);
      showSnackbar({
        message: 'Cliente eliminado con éxito',
        type: 'success',
      });
      setDetailModalVisible(false);
      setShowDeleteConfirmation(false);
      setCustomerToDelete(null);
    } catch (error) {
      showSnackbar({
        message: 'Error al eliminar el cliente',
        type: 'error',
      });
    }
  }, [deleteCustomer, showSnackbar, customerToDelete]);


  const filterOptions: FilterOption<'all' | 'active' | 'inactive'>[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
  ];


  const { ListEmptyComponent } = useListState({
    isLoading,
    isError: !!error,
    data: customers,
    emptyConfig: {
      title: 'No hay clientes',
      message: statusFilter !== 'all'
        ? `No hay clientes ${statusFilter === 'active' ? 'activos' : 'inactivos'}.`
        : 'No hay clientes registrados. Presiona el botón + para crear el primero.',
      icon: 'account-group-outline',
    },
  });

  const handleSubmit = useCallback(
    async (data: CustomerFormInputs) => {
      try {
        if (editingItem) {
          await updateMutation.mutateAsync({
            id: editingItem.id,
            data,
          });
          showSnackbar({
            message: 'Cliente actualizado con éxito',
            type: 'success',
          });
        } else {
          await createMutation.mutateAsync(data);
          showSnackbar({
            message: 'Cliente creado con éxito',
            type: 'success',
          });
        }
        handleCloseModals();
      } catch (error) {
        showSnackbar({
          message: 'Error al guardar el cliente',
          type: 'error',
        });
      }
    },
    [
      editingItem,
      createMutation,
      updateMutation,
      handleCloseModals,
      showSnackbar,
    ],
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.container}>
        <GenericList
          items={customers || []}
          isLoading={isLoading}
          isRefreshing={isFetching}
          onRefresh={refetch}
          onItemPress={handleItemPress}
          renderConfig={{
            titleField: 'firstName' as keyof Customer,
            descriptionField: 'email' as keyof Customer,
            statusConfig: {
              field: 'isActive' as keyof Customer,
              activeValue: true,
              activeLabel: 'Activo',
              inactiveLabel: 'Inactivo',
            },
          }}
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Buscar por nombre..."
          filterOptions={filterOptions}
          filterValue={statusFilter}
          onFilterChange={handleFilterChange}
          showFab={true}
          onFabPress={handleOpenCreateModal}
          ListEmptyComponent={ListEmptyComponent}
          isDrawerOpen={isDrawerOpen}
          enableSearch={true}
        />
      </View>

      <Portal>
        <CustomerFormModal
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          onSubmit={handleSubmit}
          editingItem={editingItem}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />

        <GenericDetailModal
          visible={detailModalVisible}
          onDismiss={() => setDetailModalVisible(false)}
          item={selectedCustomer}
          titleField="firstName"
          descriptionField="lastName"
          statusConfig={{
            field: 'isActive' as keyof Customer,
            activeValue: true,
            activeLabel: 'Activo',
            inactiveLabel: 'Inactivo',
          }}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          isDeleting={false}
          fieldsToDisplay={[
            {
              field: 'phoneNumber' as keyof Customer,
              label: 'Teléfono',
              render: (value) => (value as string) || 'No registrado',
            },
            {
              field: 'email' as keyof Customer,
              label: 'Correo',
              render: (value) => (value as string) || 'No registrado',
            },
            {
              field: 'birthDate' as keyof Customer,
              label: 'Fecha de nacimiento',
              render: (value) => 
                value ? new Date(value as string).toLocaleDateString() : 'No registrada',
            },
            {
              field: 'totalOrders' as keyof Customer,
              label: 'Total de pedidos',
              render: (value) => value?.toString() || '0',
            },
            {
              field: 'totalSpent' as keyof Customer,
              label: 'Total gastado',
              render: (value) => formatCurrency(value as number || 0),
            },
            {
              field: 'lastInteraction' as keyof Customer,
              label: 'Última interacción',
              render: (value) => 
                value ? new Date(value as string).toLocaleString() : 'Sin interacciones',
            },
          ]}
        />

        <ConfirmationModal
          visible={showDeleteConfirmation}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmButtonColor={theme.colors.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setCustomerToDelete(null);
          }}
          onDismiss={() => {
            setShowDeleteConfirmation(false);
            setCustomerToDelete(null);
          }}
        />
      </Portal>
    </SafeAreaView>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    rightContent: {
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: theme.spacing.xs,
    },
    activeChip: {
      backgroundColor: theme.colors.primaryContainer,
    },
    inactiveChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    statsChip: {
      backgroundColor: theme.colors.surfaceVariant,
    },
  });

export default CustomersScreen;