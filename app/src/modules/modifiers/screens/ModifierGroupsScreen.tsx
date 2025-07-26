import React, { useMemo, useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';

import { modifierGroupService } from '../services/modifierGroupService';
import { ModifierGroup } from '../schema/modifierGroup.schema';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import debounce from 'lodash.debounce';
import ModifierGroupFormModal from '../components/ModifierGroupFormModal';
import GenericList, {
  RenderItemConfig,
  FilterOption,
} from '@/app/components/crud/GenericList';
import GenericDetailModal, {
  DisplayFieldConfig,
} from '@/app/components/crud/GenericDetailModal';
import { useCrudScreenLogic } from '@/app/hooks/useCrudScreenLogic';
import { PaginatedResponse } from '@/app/types/api.types';
import { useListState } from '@/app/hooks/useListState';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';

type NavigationProps = {
  navigate: (screen: string, params?: any) => void;
};

type StatusFilter = 'all' | 'active' | 'inactive';

const QUERY_KEY = ['modifierGroups'];

const ModifierGroupsScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProps>();
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const debouncedSetSearch = useCallback(
    debounce((query: string) => setDebouncedSearchQuery(query), 300),
    [],
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  const queryParams = useMemo(() => {
    const params: Parameters<typeof modifierGroupService.findAll>[0] = {};
    if (statusFilter !== 'all') {
      params.isActive = statusFilter === 'active';
    }
    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }
    return params;
  }, [statusFilter, debouncedSearchQuery]);

  const {
    data: paginatedData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<ModifierGroup>, Error>({
    queryKey: [QUERY_KEY[0], queryParams],
    queryFn: () => modifierGroupService.findAll(queryParams),
  });

  useRefreshModuleOnFocus('modifierGroups');

  const modifierGroups = paginatedData?.data || [];

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
  } = useCrudScreenLogic<ModifierGroup>({
    entityName: 'Grupo de Modificadores',
    queryKey: [QUERY_KEY[0], queryParams],
    deleteMutationFn: modifierGroupService.remove,
  });

  const handleNavigateToModifiers = (groupId: string, groupName: string) => {
    navigation.navigate('ModifiersScreen', { groupId, groupName });
  };

  const handleFormSaveSuccess = () => {
    handleCloseModals();
  };

  const handleFilterChange = (value: string | number) => {
    if (value === 'all' || value === 'active' || value === 'inactive') {
      setStatusFilter(value as StatusFilter);
    } else {
      setStatusFilter('all');
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const listRenderConfig: RenderItemConfig<ModifierGroup> = {
    titleField: 'name',
    descriptionField: 'description',
    sortOrderField: 'sortOrder',
    statusConfig: {
      field: 'isActive',
      activeValue: true,
      activeLabel: 'Activo',
      inactiveLabel: 'Inactivo',
    },
    renderDescription: (item) => {
      const parts = [];

      if (item.sortOrder !== undefined && item.sortOrder !== null) {
        parts.push(`Orden: ${item.sortOrder}`);
      }

      parts.push(`Requerido: ${item.isRequired ? 'Sí' : 'No'}`);
      parts.push(`Múltiples: ${item.allowMultipleSelections ? 'Sí' : 'No'}`);

      if (item.description) {
        parts.push(item.description);
      }

      return (
        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
          {parts.join(' • ')}
        </Text>
      );
    },
  };

  const detailFields: DisplayFieldConfig<ModifierGroup>[] = [
    { field: 'sortOrder', label: 'Orden de Visualización' },
    { field: 'minSelections', label: 'Mín. Selecciones' },
    { field: 'maxSelections', label: 'Máx. Selecciones' },
    {
      field: 'isRequired',
      label: 'Requerido',
      render: (value) => (
        <Text style={{ color: theme.colors.onSurface }}>
          {value ? 'Sí' : 'No'}
        </Text>
      ),
    },
    {
      field: 'allowMultipleSelections',
      label: 'Permite Múltiples',
      render: (value) => (
        <Text style={{ color: theme.colors.onSurface }}>
          {value ? 'Sí' : 'No'}
        </Text>
      ),
    },
  ];

  const styles = useMemo(() => createStyles(theme), [theme]);

  const filterOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  const { ListEmptyComponent } = useListState({
    isLoading: isLoading && !isRefetching,
    isError,
    data: modifierGroups,
    emptyConfig: {
      title: searchQuery
        ? 'No se encontraron grupos'
        : 'No hay grupos de modificadores',
      message: searchQuery
        ? `No se encontraron grupos para "${searchQuery}"`
        : statusFilter !== 'all'
          ? `No hay grupos de modificadores ${statusFilter === 'active' ? 'activos' : 'inactivos'}.`
          : 'No hay grupos de modificadores registrados. Presiona el botón + para crear el primero.',
      icon: 'folder-multiple-outline',
    },
    errorConfig: {
      title: 'Error al cargar grupos',
      message:
        'No se pudieron cargar los grupos de modificadores. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetch,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<ModifierGroup>
        items={modifierGroups}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal}
        onRefresh={handleRefresh}
        isRefreshing={isRefetching}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoading}
        enableSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar grupos..."
        filterValue={statusFilter}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isFormModalVisible || isDetailModalVisible}
        showImagePlaceholder={false}
        isDrawerOpen={isDrawerOpen}
        renderItemActions={(item) => (
          <IconButton
            icon="format-list-bulleted"
            size={24}
            onPress={(e) => {
              e.stopPropagation();
              handleNavigateToModifiers(item.id, item.name);
            }}
          />
        )}
      />

      <ModifierGroupFormModal
        visible={isFormModalVisible}
        onDismiss={handleCloseModals}
        onSaveSuccess={handleFormSaveSuccess}
        initialData={editingItem}
      />

      <GenericDetailModal<ModifierGroup>
        visible={isDetailModalVisible}
        onDismiss={handleCloseModals}
        item={selectedItem}
        titleField="name"
        descriptionField="description"
        statusConfig={listRenderConfig.statusConfig}
        fieldsToDisplay={detailFields}
        onEdit={() => {
          if (selectedItem) {
            handleOpenEditModal(selectedItem);
          }
        }}
        deleteConfirmation={deleteConfirmation}
        isDeleting={isDeleting}
        editButtonLabel="Editar"
        deleteButtonLabel="Eliminar"
        showImage={false}
      ></GenericDetailModal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 18,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 10,
      textAlign: 'center',
    },
    detailActionButton: {
      marginTop: theme.spacing.m,
      alignSelf: 'stretch',
      borderRadius: theme.roundness,
    },
  });

export default ModifierGroupsScreen;
