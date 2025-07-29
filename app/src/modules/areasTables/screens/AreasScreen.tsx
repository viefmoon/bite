import React, { useMemo, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
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
import { NAVIGATION_PATHS } from '../../../app/constants/navigationPaths';

import AreaFormModal from '../components/AreaFormModal';
import {
  useGetAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
} from '../hooks/useAreasQueries';
import type { Area } from '@/app/schemas/domain/area.schema';
import { CreateAreaDto, UpdateAreaDto } from '../schema/area-form.schema';
import { AreasListScreenProps } from '../navigation/types';

const AreasScreen: React.FC<AreasListScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => getStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');

  const {
    data: areasData = [],
    isLoading: isLoadingAreas,
    isError: isErrorAreas,
    refetch: refetchAreas,
    isRefetching,
  } = useGetAreas(
    {
      name: searchQuery || undefined,
      isActive: filterStatus === 'all' ? undefined : filterStatus === 'true',
    },
    { page: 1, limit: 100 },
  );

  const createAreaMutation = useCreateArea();
  const updateAreaMutation = useUpdateArea();
  const { mutateAsync: deleteArea } = useDeleteArea();

  useRefreshModuleOnFocus('areas');

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
  } = useCrudScreenLogic<Area>({
    entityName: 'Área',
    queryKey: [
      'areas',
      {
        name: searchQuery || undefined,
        isActive: filterStatus === 'all' ? undefined : filterStatus === 'true',
      },
    ],
    deleteMutationFn: deleteArea,
  });

  const isSubmitting =
    createAreaMutation.isPending || updateAreaMutation.isPending;

  const handleFormSubmit = async (data: CreateAreaDto | UpdateAreaDto) => {
    try {
      if (editingItem) {
        await updateAreaMutation.mutateAsync({
          id: editingItem.id,
          data: data as UpdateAreaDto,
        });
      } else {
        await createAreaMutation.mutateAsync(data as CreateAreaDto);
      }
      handleCloseModals();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleNavigateToTables = (area: Area) => {
    navigation.navigate(NAVIGATION_PATHS.TABLES_LIST, {
      areaId: area.id,
      areaName: area.name,
    });
  };

  const listRenderConfig: RenderItemConfig<Area> = {
    titleField: 'name',
    descriptionField: 'description',
    statusConfig: {
      field: 'isActive',
      activeValue: true,
      activeLabel: 'Activa',
      inactiveLabel: 'Inactiva',
    },
  };

  const areaDetailFields: DisplayFieldConfig<Area>[] = [
    { field: 'description', label: 'Descripción' },
  ];
  const areaDetailStatusConfig = listRenderConfig.statusConfig;

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
    refetchAreas();
  }, [refetchAreas]);

  const renderItemActions = (item: Area) => (
    <IconButton
      icon="format-list-bulleted"
      size={responsive.isTablet ? 24 : 28}
      onPress={() => handleNavigateToTables(item)}
      iconColor={theme.colors.primary}
    />
  );

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingAreas,
    isError: isErrorAreas,
    data: areasData,
    emptyConfig: {
      title: 'No hay áreas',
      message:
        'No hay áreas registradas. Presiona el botón + para crear la primera.',
      icon: 'map-marker-outline',
    },
    errorConfig: {
      title: 'Error al cargar áreas',
      message: 'No se pudieron cargar las áreas. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetchAreas,
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<Area>
        items={areasData}
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
        renderItemActions={renderItemActions}
        isModalOpen={isFormModalVisible || isDetailModalVisible}
        isDrawerOpen={isDrawerOpen}
        showImagePlaceholder={false}
      />

      <AreaFormModal
        visible={isFormModalVisible}
        onDismiss={handleCloseModals}
        onSubmit={handleFormSubmit}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
      />

      <GenericDetailModal<Area>
        visible={isDetailModalVisible}
        onDismiss={handleCloseModals}
        item={selectedItem}
        titleField="name"
        statusConfig={areaDetailStatusConfig}
        fieldsToDisplay={areaDetailFields}
        onEdit={() => {
          if (selectedItem) {
            handleOpenEditModal(selectedItem);
          }
        }}
        onDelete={(id) => deleteArea(id)}
        isDeleting={isDeleting}
        showImage={false}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

export default AreasScreen;
