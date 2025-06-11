import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Text,
  Button,
  IconButton,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';

import { modifierGroupService } from '../services/modifierGroupService';
import { ModifierGroup } from '../schema/modifierGroup.schema';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { debounce } from 'lodash';
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
    error,
    refetch,
    isRefetching,
  } = useQuery<PaginatedResponse<ModifierGroup>, Error>({
    queryKey: [QUERY_KEY[0], queryParams],
    queryFn: () => modifierGroupService.findAll(queryParams),
  });

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
    handleDeleteItem,
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
    // Validar que el valor sea uno de los StatusFilter esperados
    if (value === 'all' || value === 'active' || value === 'inactive') {
      setStatusFilter(value as StatusFilter);
    } else {
      // Opcional: manejar valor inesperado, por ahora default a 'all'
      console.warn(
        `Valor de filtro inesperado recibido: ${value}, usando 'all'.`,
      );
      setStatusFilter('all');
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  const listRenderConfig: RenderItemConfig<ModifierGroup> = {
    titleField: 'name',
    descriptionField: 'description',
    statusConfig: {
      field: 'isActive',
      activeValue: true,
      activeLabel: 'Activo',
      inactiveLabel: 'Inactivo',
    },
  };

  const detailFields: DisplayFieldConfig<ModifierGroup>[] = [
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
        isLoading={isLoading} // Pasar directamente el estado de carga principal
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
        onDelete={handleDeleteItem}
        isDeleting={isDeleting}
        editButtonLabel="Editar"
        deleteButtonLabel="Eliminar"
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
