import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';

import GenericList, {
  FilterOption,
} from '../../../app/components/crud/GenericList';
import GenericDetailModal, {
  DisplayFieldConfig,
} from '../../../app/components/crud/GenericDetailModal';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic';
import PreparationScreenFormModal from '../components/PreparationScreenFormModal';
import { ProductSelectionModal } from '../components/ProductSelectionModal';
import {
  useGetPreparationScreens,
  useGetPreparationScreenById,
  useDeletePreparationScreen,
  useGetMenuWithAssociations,
  useAssociateProducts,
} from '../hooks/usePreparationScreensQueries';
import {
  PreparationScreen,
  FindAllPreparationScreensDto as FindAllPreparationScreensFilter,
} from '../schema/preparationScreen.schema';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { BaseListQuery } from '../../../app/types/query.types';
import { useListState } from '@/app/hooks/useListState';

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
      marginTop: 50,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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

const PreparationScreensScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [filters, setFilters] = useState<FindAllPreparationScreensFilter>({});
  const [pagination, setPagination] = useState<BaseListQuery>({
    page: 1,
    limit: 15,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [productModalScreenId, setProductModalScreenId] = useState<
    string | null
  >(null);

  const {
    data: screensData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
    error: errorList,
  } = useGetPreparationScreens(filters, pagination);

  const { mutate: deleteScreenMutate } = useDeletePreparationScreen();
  const associateProductsMutation = useAssociateProducts();

  const deleteScreenWrapper = useCallback(
    async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        deleteScreenMutate(id, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      });
    },
    [deleteScreenMutate],
  );

  // Hooks para el modal de productos
  const { data: menuData, isLoading: isLoadingMenu } =
    useGetMenuWithAssociations(productModalScreenId, {
      enabled: !!productModalScreenId && isProductModalVisible,
    });

  const handleOpenProductModal = useCallback((screen: PreparationScreen) => {
    setProductModalScreenId(screen.id);
    setIsProductModalVisible(true);
  }, []);

  const handleCloseProductModal = useCallback(() => {
    setIsProductModalVisible(false);
    setProductModalScreenId(null);
  }, []);

  const handleSaveProducts = useCallback(
    (productIds: string[]) => {
      if (productModalScreenId) {
        associateProductsMutation.mutate(
          { id: productModalScreenId, productIds },
          {
            onSuccess: () => {
              handleCloseProductModal();
              refetchList();
            },
          },
        );
      }
    },
    [
      productModalScreenId,
      associateProductsMutation,
      handleCloseProductModal,
      refetchList,
    ],
  );

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
  } = useCrudScreenLogic<PreparationScreen>({
    entityName: 'Pantalla de Preparación',
    queryKey: ['preparationScreens', filters, pagination],
    deleteMutationFn: deleteScreenWrapper,
  });

  const selectedScreenId = selectedItem?.id ?? null;

  const { data: selectedScreenData } = useGetPreparationScreenById(
    selectedScreenId,
    {
      enabled: !!selectedScreenId && isDetailModalVisible,
    },
  );

  const handleRefresh = useCallback(() => {
    refetchList();
  }, [refetchList]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
    const timerId = setTimeout(() => {
      setFilters((prev: FindAllPreparationScreensFilter) => ({
        ...prev,
        name: query || undefined,
      }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timerId);
  }, []);

  const handleFilterChange = useCallback((value: string | number) => {
    const strValue = String(value);
    let newIsActive: boolean | undefined;
    if (strValue === 'true') newIsActive = true;
    else if (strValue === 'false') newIsActive = false;
    else newIsActive = undefined;
    setFilters((prev: FindAllPreparationScreensFilter) => ({
      ...prev,
      isActive: newIsActive,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const listRenderConfig = {
    titleField: 'name' as keyof PreparationScreen,
    descriptionField: 'description' as keyof PreparationScreen,
    statusConfig: {
      field: 'isActive' as keyof PreparationScreen,
      activeValue: true,
      activeLabel: 'Activa',
      inactiveLabel: 'Inactiva',
    },
  };

  const filterOptions: FilterOption<string>[] = [
    { value: '', label: 'Todas' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' },
  ];

  const detailFields: DisplayFieldConfig<PreparationScreen>[] = [
    {
      field: 'products',
      label: 'Productos Asociados',
      render: (products, item) => {
        const productCount = Array.isArray(products) ? products.length : 0;
        return (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={[styles.fieldValue, { flex: 1 }]}>
              {productCount > 0 ? `${productCount} productos` : 'Ninguno'}
            </Text>
            <Button
              mode="outlined"
              compact
              onPress={() => item && handleOpenProductModal(item)}
              icon="link"
            >
              Gestionar
            </Button>
          </View>
        );
      },
    },
  ];

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingList,
    isError: !!errorList,
    data: screensData?.data,
    emptyConfig: {
      title: searchTerm
        ? 'No se encontraron pantallas'
        : 'No hay pantallas de preparación',
      message: searchTerm
        ? `No se encontraron pantallas para "${searchTerm}"`
        : 'No hay pantallas de preparación creadas. Presiona el botón + para crear la primera.',
      icon: 'monitor-dashboard',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<PreparationScreen>
        showImagePlaceholder={false}
        items={screensData?.data ?? []}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal}
        onRefresh={handleRefresh}
        isRefreshing={isFetchingList && !isLoadingList}
        ListEmptyComponent={ListEmptyComponent}
        enableSearch={true}
        searchQuery={searchTerm}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre..."
        filterOptions={filterOptions}
        filterValue={
          filters.isActive === true
            ? 'true'
            : filters.isActive === false
              ? 'false'
              : ''
        }
        onFilterChange={handleFilterChange}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={
          isDetailModalVisible || isFormModalVisible || isProductModalVisible
        }
        isDrawerOpen={isDrawerOpen}
        renderItemActions={(item) => (
          <IconButton
            icon="link"
            size={20}
            onPress={() => handleOpenProductModal(item)}
          />
        )}
      />

      <GenericDetailModal<PreparationScreen>
        visible={isDetailModalVisible}
        onDismiss={handleCloseModals}
        item={selectedScreenData ?? selectedItem ?? null}
        titleField="name"
        descriptionField="description"
        statusConfig={listRenderConfig.statusConfig}
        fieldsToDisplay={detailFields}
        onEdit={() => {
          const itemToEdit = selectedScreenData ?? selectedItem;
          if (itemToEdit) {
            handleOpenEditModal(itemToEdit);
          }
        }}
        onDelete={handleDeleteItem}
        isDeleting={isDeleting}
        editButtonLabel="Editar"
        deleteButtonLabel="Eliminar"
        closeButtonLabel="Cerrar"
      />

      <PreparationScreenFormModal
        visible={isFormModalVisible}
        onDismiss={handleCloseModals}
        editingItem={editingItem}
        onSubmitSuccess={() => {}}
      />

      <ProductSelectionModal
        visible={isProductModalVisible}
        onDismiss={handleCloseProductModal}
        onSave={handleSaveProducts}
        screenId={productModalScreenId || ''}
        menuData={menuData}
        loading={isLoadingMenu}
      />
    </SafeAreaView>
  );
};

export default PreparationScreensScreen;
