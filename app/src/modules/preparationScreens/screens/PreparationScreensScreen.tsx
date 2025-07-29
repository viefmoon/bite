import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawerStatus } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { discoveryService } from '@/app/services/discoveryService';

import GenericList, {
  FilterOption,
} from '../../../app/components/crud/GenericList';
import PreparationScreenDetailModalSimple from '../components/PreparationScreenDetailModalSimple';
import PreparationScreenListItem from '../components/PreparationScreenListItem';
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
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
  });

const PreparationScreensScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';
  const queryClient = useQueryClient();

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

  // Recargar automáticamente cuando la pantalla recibe foco
  useRefreshModuleOnFocus('preparation-screens');

  // Invalidar queries de usuarios cuando la pantalla recibe foco
  useFocusEffect(
    useCallback(() => {
      // Invalidar todas las queries de usuarios para asegurar datos frescos
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }, [queryClient])
  );

  // Enriquecer menuData con información de pantallas
  const enrichedMenuData = React.useMemo(() => {
    if (!menuData || !screensData?.data) return menuData;

    // Crear un mapa de productId a nombre de pantalla
    const screenAssignments: Record<string, string> = {};

    screensData.data.forEach((screen) => {
      if (screen.products) {
        screen.products.forEach((product) => {
          screenAssignments[product.id] = screen.name;
        });
      }
    });

    return {
      ...menuData,
      screenAssignments,
    };
  }, [menuData, screensData]);

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
    deleteConfirmation,
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

  const handleRefresh = useCallback(async () => {
    // Si hay error de conexión, intentar redescubrir el servidor
    if (
      errorList &&
      (errorList.message?.includes('conexión') ||
        errorList.message?.includes('network'))
    ) {
      try {
        await discoveryService.forceRediscovery();
        // Dar tiempo para que se reinicialice el cliente
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        // No es crítico, el usuario puede intentar manualmente
      }
    }
    refetchList();
  }, [refetchList, errorList]);

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
    renderDescription: (item: PreparationScreen) => {
      const parts: string[] = [];

      if (item.description) {
        parts.push(item.description);
      }

      if (item.users && item.users.length > 0) {
        const userNames = item.users
          .map((user) => {
            const fullName =
              `${user.firstName || ''} ${user.lastName || ''}`.trim();
            return fullName || user.username;
          })
          .join(', ');
        parts.push(`Usuarios: ${userNames}`);
      }

      const text = parts.join(' • ');
      if (!text) return null;

      return (
        <Text variant="bodyMedium" numberOfLines={2} ellipsizeMode="tail">
          {text}
        </Text>
      );
    },
  };

  const filterOptions: FilterOption<string>[] = [
    { value: '', label: 'Todas' },
    { value: 'true', label: 'Activas' },
    { value: 'false', label: 'Inactivas' },
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
    errorConfig: {
      title: 'Error al cargar pantallas',
      message: errorList?.message?.includes('encontrar el servidor')
        ? 'No se pudo encontrar el servidor. Verifica que el servidor esté encendido y en la misma red.'
        : 'No se pudieron cargar las pantallas de preparación. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      actionLabel: 'Reintentar',
      onAction: handleRefresh,
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: PreparationScreen }) => (
      <PreparationScreenListItem
        item={item}
        onPress={handleOpenDetailModal}
        onManageProducts={handleOpenProductModal}
      />
    ),
    [handleOpenDetailModal, handleOpenProductModal],
  );

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
        renderItem={renderItem}
      />

      <PreparationScreenDetailModalSimple
        visible={isDetailModalVisible}
        onDismiss={handleCloseModals}
        item={selectedScreenData ?? selectedItem ?? null}
        onEdit={() => {
          const itemToEdit = selectedScreenData ?? selectedItem;
          if (itemToEdit) {
            handleOpenEditModal(itemToEdit);
          }
        }}
        onDelete={deleteConfirmation.show}
        deleteConfirmation={deleteConfirmation}
        onManageProducts={handleOpenProductModal}
        isDeleting={isDeleting}
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
        menuData={enrichedMenuData}
        loading={isLoadingMenu || associateProductsMutation.isPending}
      />
    </SafeAreaView>
  );
};

export default PreparationScreensScreen;
