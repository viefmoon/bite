import React, { useLayoutEffect, useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
FAB,
  ActivityIndicator,
  Text,
  Portal,
Button,} from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';

import { modifierService } from '../services/modifierService';
import { Modifier } from '../schema/modifier.schema';
import { useAppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';
import { debounce } from 'lodash';
import { useCrudScreenLogic } from '@/app/hooks/useCrudScreenLogic';

import ModifierFormModal from '@/modules/modifiers/components/ModifierFormModal';
import GenericList, {
  RenderItemConfig,
  FilterOption,
} from '@/app/components/crud/GenericList';
import GenericDetailModal, {
  DisplayFieldConfig,
} from '@/app/components/crud/GenericDetailModal';
import { useListState } from '@/app/hooks/useListState';

type StatusFilter = 'all' | 'active' | 'inactive';

type ModifiersScreenRouteParams = {
  groupId: string;
  groupName: string;
};

type ModifiersScreenRouteProp = RouteProp<
  { params: ModifiersScreenRouteParams },
  'params'
>;

type NavigationProps = {
  goBack: () => void;
  setOptions: (options: object) => void;
};

const ModifiersScreen = () => {
  const theme = useAppTheme();
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute<ModifiersScreenRouteProp>();
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const { groupId, groupName } = route.params ?? {};

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const QUERY_KEY = ['modifiers', groupId];

  const debouncedSetSearch = useCallback(
    debounce((query: string) => setDebouncedSearchQuery(query), 300),
    [],
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  useLayoutEffect(() => {
    if (groupName) {
      navigation.setOptions({
        headerTitle: `Modificadores: ${groupName}`,
      });
    }
  }, [navigation, groupName]);

  const queryParams = useMemo(() => {
    const params: Parameters<typeof modifierService.findByGroupId>[1] = {};
    if (statusFilter !== 'all') {
      params.isActive = statusFilter === 'active';
    }
    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }
    return params;
  }, [statusFilter, debouncedSearchQuery]);

  const {
    data: modifiers = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery<Modifier[], Error>({
    queryKey: [QUERY_KEY[0], groupId, queryParams],
    queryFn: () => modifierService.findByGroupId(groupId, queryParams),
    enabled: !!groupId,
  });

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
  } = useCrudScreenLogic<Modifier>({
    entityName: 'Modificador',
    queryKey: QUERY_KEY,
    deleteMutationFn: modifierService.remove,
  });

  const handleFormModalSave = () => {
    handleCloseModals();
  };

  const handleEditFromDetails = (modifier: Modifier) => {
    handleOpenEditModal(modifier);
  };

  const handleFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
  };

  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError,
    data: modifiers,
    emptyConfig: {
      title: searchQuery
        ? 'No se encontraron modificadores'
        : 'No hay modificadores',
      message: searchQuery
        ? `No se encontraron modificadores para "${searchQuery}"`
        : statusFilter !== 'all'
          ? `No hay modificadores ${statusFilter === 'active' ? 'activos' : 'inactivos'} en este grupo.`
          : `No hay modificadores en "${groupName}". Presiona el botón + para crear el primero.`,
      icon: 'format-list-bulleted',
    },
  });

  if (!groupId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Error: No se proporcionó ID del grupo.
        </Text>
        <Button onPress={() => navigation.goBack()}>Volver</Button>
      </View>
    );
  }

  if (isLoading && !isRefetching) {
    return <ActivityIndicator animating={true} style={styles.centered} />;
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          Error al cargar modificadores: {getApiErrorMessage(error)}
        </Text>
        <Button onPress={() => refetch()}>Reintentar</Button>
      </View>
    );
  }

  const listRenderConfig: RenderItemConfig<Modifier> = {
    titleField: 'name',
    priceField: 'price',
    sortOrderField: 'sortOrder',
    isDefaultField: 'isDefault',
    statusConfig: {
      field: 'isActive',
      activeValue: true,
      activeLabel: 'Activo',
      inactiveLabel: 'Inactivo',
    },
  };

  const detailFields: DisplayFieldConfig<Modifier>[] = [
    {
      field: 'price',
      label: 'Precio Adicional',
      render: (value) => (
        <Text style={styles.fieldValue}>
          {value !== null ? `$${Number(value).toFixed(2)}` : 'N/A'}
        </Text>
      ),
    },
    {
      field: 'sortOrder',
      label: 'Orden',
    },
    {
      field: 'isDefault',
      label: 'Por Defecto',
    },
  ];

  const filterOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<Modifier>
        items={modifiers}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoading && !isRefetching}
        enableSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar modificadores..."
        filterValue={statusFilter}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        fabLabel="Añadir Modificador"
        isModalOpen={isFormModalVisible || isDetailModalVisible}
        showImagePlaceholder={false}
        isDrawerOpen={isDrawerOpen}
      />

      <Portal>
        <ModifierFormModal
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          onSaveSuccess={handleFormModalSave}
          initialData={editingItem}
          groupId={groupId}
        />

        <GenericDetailModal<Modifier>
          visible={isDetailModalVisible}
          onDismiss={handleCloseModals}
          item={selectedItem}
          titleField="name"
          descriptionField="description"
          statusConfig={listRenderConfig.statusConfig}
          fieldsToDisplay={detailFields}
          onEdit={handleEditFromDetails}
          onDelete={handleDeleteItem}
          isDeleting={isDeleting}
        />
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
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
    emptySubText: {
      textAlign: 'center',
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      color: theme.colors.error,
      marginBottom: 10,
      textAlign: 'center',
    },
    fieldValue: {
      flexShrink: 1,
      textAlign: 'right',
      color: theme.colors.onSurface,
    },
  });

export default ModifiersScreen;
