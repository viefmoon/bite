import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';
import debounce from 'lodash.debounce';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';

import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '../hooks/useCustomersQueries';
import { Customer, CustomerFormInputs } from '../schema/customer.schema';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import GenericList, { FilterOption } from '@/app/components/crud/GenericList';
import GenericDetailModal from '@/app/components/crud/GenericDetailModal';
import CustomerFormModal from '../components/CustomerFormModal';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useCrudScreenLogic } from '@/app/hooks/useCrudScreenLogic';
import { useListState } from '@/app/hooks/useListState';
import { formatCurrency } from '@/app/lib/formatters';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';

function CustomersScreen(): React.ReactElement {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme as AppTheme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive' | 'banned'
  >('all');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
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
    if (
      value === 'all' ||
      value === 'active' ||
      value === 'inactive' ||
      value === 'banned'
    ) {
      setStatusFilter(value);
    } else {
      setStatusFilter('all');
    }
  };

  const queryFilters = useMemo(() => {
    const filters: any = {};

    if (debouncedSearchQuery) {
      filters.firstName = debouncedSearchQuery;
      filters.lastName = debouncedSearchQuery;
    }

    if (statusFilter === 'active') {
      filters.isActive = true;
    } else if (statusFilter === 'inactive') {
      filters.isActive = false;
    } else if (statusFilter === 'banned') {
      filters.isBanned = true;
    }

    return filters;
  }, [debouncedSearchQuery, statusFilter]);

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

  useRefreshModuleOnFocus('customers');

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
    (item: any) => {
      setDetailModalVisible(false);
      const { fullName, ...originalCustomer } = item;
      originalHandleOpenEditModal(originalCustomer as Customer);
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

  const handleDelete = useCallback((id: string) => {
    setCustomerToDelete(id);
    setShowDeleteConfirmation(true);
  }, []);

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

  const filterOptions: FilterOption<
    'all' | 'active' | 'inactive' | 'banned'
  >[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Baneados', value: 'banned' },
  ];

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError: !!error,
    data: customers,
    emptyConfig: {
      title: 'No hay clientes',
      message:
        statusFilter !== 'all'
          ? `No hay clientes ${
              statusFilter === 'active'
                ? 'activos'
                : statusFilter === 'inactive'
                  ? 'inactivos'
                  : 'baneados'
            }.`
          : 'No hay clientes registrados. Presiona el botón + para crear el primero.',
      icon: 'account-group-outline',
    },
    errorConfig: {
      title: 'Error al cargar clientes',
      message: 'No se pudieron cargar los clientes. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetch,
    },
  });

  const mappedCustomers = useMemo(() => {
    return (
      customers?.map((customer) => ({
        ...customer,
        fullName: `${customer.firstName} ${customer.lastName}`.trim(),
        displayTitle:
          `${customer.firstName} ${customer.lastName} - ${customer.whatsappPhoneNumber}`.trim(),
        displayStatus: customer.isActive ? 'active' : 'inactive',
        whatsappInfo:
          customer.whatsappMessageCount > 0
            ? `💬 ${customer.whatsappMessageCount}`
            : null,
      })) || []
    );
  }, [customers]);

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
          items={mappedCustomers}
          isLoading={isLoading}
          isRefreshing={isFetching}
          onRefresh={refetch}
          onItemPress={handleItemPress}
          renderConfig={{
            titleField: 'displayTitle' as keyof Customer,
            statusConfig: {
              field: 'displayStatus' as keyof Customer,
              activeValue: 'active',
              activeLabel: 'Activo',
              inactiveLabel: 'Inactivo',
            },
            renderDescription: (item: any) => (
              <View>
                {item.email && (
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    {item.email}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    {item.isBanned ? '⛔ Baneado' : '✅ No baneado'}
                  </Text>
                  <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                    • 📍 {item.addresses?.length || 0} direcciones
                  </Text>
                </View>
              </View>
            ),
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
          showImagePlaceholder={false}
          placeholderIcon="account-group-outline"
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
          item={
            selectedCustomer
              ? {
                  ...selectedCustomer,
                  fullName:
                    `${selectedCustomer.firstName} ${selectedCustomer.lastName}`.trim(),
                }
              : null
          }
          titleField="fullName"
          descriptionField="email"
          statusConfig={{
            field: 'isActive' as keyof Customer,
            activeValue: true,
            activeLabel: 'Activo',
            inactiveLabel: 'Inactivo',
          }}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          isDeleting={false}
          showImage={false}
          fieldsToDisplay={[
            {
              field: 'isBanned' as keyof Customer,
              label: 'Estado de baneo',
              render: (value) => (value ? '⛔ Baneado' : '✅ No baneado'),
            },
            {
              field: 'whatsappPhoneNumber' as keyof Customer,
              label: 'WhatsApp',
              render: (value) => (value as string) || 'No registrado',
            },
            {
              field: 'stripeCustomerId' as keyof Customer,
              label: 'Stripe Customer ID',
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
                value
                  ? new Date(value as string).toLocaleDateString()
                  : 'No registrada',
            },
            {
              field: 'addresses' as keyof Customer,
              label: 'Direcciones',
              render: (value) => {
                const addresses = value as any[];
                const count = addresses?.length || 0;
                if (count === 0) return '❌ Sin direcciones';
                if (count === 1) return '📍 1 dirección';
                return `📍 ${count} direcciones ${count > 3 ? '✨' : ''}`;
              },
            },
            {
              field: 'totalOrders' as keyof Customer,
              label: 'Total de pedidos',
              render: (value) => value?.toString() || '0',
            },
            {
              field: 'totalSpent' as keyof Customer,
              label: 'Total gastado',
              render: (value) => formatCurrency((value as number) || 0),
            },
            {
              field: 'lastInteraction' as keyof Customer,
              label: 'Última interacción',
              render: (value) =>
                value
                  ? new Date(value as string).toLocaleString()
                  : 'Sin interacciones',
            },
            {
              field: 'whatsappMessageCount' as keyof Customer,
              label: 'Mensajes de WhatsApp',
              render: (value) => `${value || 0} mensajes`,
            },
            {
              field: 'lastWhatsappMessageTime' as keyof Customer,
              label: 'Último mensaje WhatsApp',
              render: (value) =>
                value
                  ? new Date(value as string).toLocaleString()
                  : 'Sin mensajes',
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
