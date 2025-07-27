import React, { useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';

import GenericList, {
  RenderItemConfig,
  FilterOption,
} from '../../../app/components/crud/GenericList';
import GenericDetailModal, {
  DisplayFieldConfig,
} from '../../../app/components/crud/GenericDetailModal';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic';
import { useListState } from '../../../app/hooks/useListState';
import { useRefreshModuleOnFocus } from '../../../app/hooks/useRefreshOnFocus';

import TableFormModal from '../components/TableFormModal';
import {
  useGetTablesByAreaId,
  useCreateTable,
  useUpdateTable,
  useDeleteTable,
} from '../hooks/useTablesQueries';
import type { Table } from '@/app/schemas/domain/table.schema';
import { CreateTableDto, UpdateTableDto } from '../schema/table.schema';
import { TablesListScreenProps } from '../navigation/types';

const TablesScreen: React.FC<TablesListScreenProps> = ({ route }) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => getStyles(theme, responsive),
    [theme, responsive],
  );
  const { areaId, areaName } = route.params;
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const {
    data: tablesData = [],
    isLoading: isLoadingTables,
    isError: isErrorTables,
    refetch: refetchTables,
    isRefetching,
  } = useGetTablesByAreaId(
    areaId,
    {
      name: searchQuery || undefined,
      isActive: filterStatus === 'all' ? undefined : filterStatus === 'true',
    },
    { enabled: !!areaId },
  );

  useRefreshModuleOnFocus('tables');

  const createTableMutation = useCreateTable();
  const updateTableMutation = useUpdateTable();
  const { mutateAsync: deleteTable } = useDeleteTable();

  const {
    isFormModalVisible,
    isDetailModalVisible,
    editingItem,
    selectedItem,
    isDeleting,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseModals,
    deleteConfirmation,
  } = useCrudScreenLogic<Table & { id: string }>({
    entityName: 'Mesa',
    queryKey: [
      'tables',
      'list',
      {
        areaId,
        name: searchQuery || undefined,
        isActive: filterStatus === 'all' ? undefined : filterStatus === 'true',
      },
    ],
    deleteMutationFn: deleteTable,
  });

  const isSubmitting =
    createTableMutation.isPending || updateTableMutation.isPending;

  const handleFormSubmit = async (data: CreateTableDto | UpdateTableDto) => {
    try {
      const dataWithAreaId = { ...data, areaId: areaId };

      if (editingItem) {
        await updateTableMutation.mutateAsync({
          id: editingItem.id,
          data: dataWithAreaId as UpdateTableDto,
        });
      } else {
        await createTableMutation.mutateAsync(dataWithAreaId as CreateTableDto);
      }
      handleCloseModals();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const listRenderConfig: RenderItemConfig<Table> = useMemo(
    () => ({
      titleField: 'name',
      descriptionField: 'capacity',
      descriptionFormatter: (capacity) =>
        capacity
          ? `Capacidad: ${capacity} ${capacity === 1 ? 'persona' : 'personas'}`
          : undefined,
      descriptionMaxLength: 30,
      statusConfig: {
        field: 'isActive',
        activeValue: true,
        activeLabel: 'Activa',
        inactiveLabel: 'Inactiva',
      },
    }),
    [],
  );

  const tableDetailFields: DisplayFieldConfig<Table>[] = useMemo(
    () => [
      {
        field: 'capacity',
        label: 'Capacidad',
        render: (value) => (
          <Text style={styles.fieldValueText}>
            {value !== null && value !== undefined
              ? String(value)
              : 'No especificada'}
          </Text>
        ),
      },
    ],
    [styles.fieldValueText],
  );

  const tableDetailStatusConfig = listRenderConfig.statusConfig;

  const filterOptions: FilterOption<string>[] = useMemo(
    () => [
      { label: 'Todas', value: 'all' },
      { label: 'Activas', value: 'true' },
      { label: 'Inactivas', value: 'false' },
    ],
    [],
  );

  const handleFilterChange = (value: string | number) => {
    setFilterStatus(String(value));
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = useCallback(() => {
    setSearchQuery('');
    setFilterStatus('all');
    refetchTables();
  }, [refetchTables]);

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingTables,
    isError: isErrorTables,
    data: tablesData,
    emptyConfig: {
      title: 'No hay mesas',
      message: `No hay mesas registradas en ${areaName}. Presiona el botón + para crear la primera.`,
      icon: 'table-furniture',
    },
    errorConfig: {
      title: 'Error al cargar mesas',
      message: 'No se pudieron cargar las mesas. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetchTables,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<Table>
        items={tablesData}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
        ListEmptyComponent={ListEmptyComponent}
        enableSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filterOptions={filterOptions}
        filterValue={filterStatus}
        onFilterChange={handleFilterChange}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isFormModalVisible || isDetailModalVisible}
        showImagePlaceholder={false}
        isDrawerOpen={isDrawerOpen}
      />

      <TableFormModal
        visible={isFormModalVisible}
        onDismiss={handleCloseModals}
        onSubmit={handleFormSubmit}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
      />

      <GenericDetailModal<Table>
        visible={isDetailModalVisible}
        onDismiss={handleCloseModals}
        item={selectedItem}
        titleField="name"
        statusConfig={tableDetailStatusConfig}
        fieldsToDisplay={tableDetailFields}
        onEdit={() => {
          if (selectedItem) {
            handleOpenEditModal(selectedItem);
          }
        }}
        deleteConfirmation={deleteConfirmation}
        isDeleting={isDeleting}
        showImage={false}
      />
    </SafeAreaView>
  );
};

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    fieldValueText: {
      flexShrink: 1,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontSize: responsive.fontSize(14),
    },
  });

export default TablesScreen;
