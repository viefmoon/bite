import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ActivityIndicator, Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDrawerStatus } from "@react-navigation/drawer";

import GenericList, {
  FilterOption,
} from "../../../app/components/crud/GenericList";
import GenericDetailModal, {
  DisplayFieldConfig,
} from "../../../app/components/crud/GenericDetailModal";
import { useCrudScreenLogic } from "../../../app/hooks/useCrudScreenLogic";
import PreparationScreenFormModal from "../components/PreparationScreenFormModal";
import {
  useGetPreparationScreens,
  useGetPreparationScreenById,
  useDeletePreparationScreen,
} from "../hooks/usePreparationScreensQueries";
import {
  PreparationScreen,
  FindAllPreparationScreensFilter,
} from "../types/preparationScreens.types";
import { useAppTheme, AppTheme } from "../../../app/styles/theme";
import { BaseListQuery } from "../../../app/types/query.types";
import { getApiErrorMessage } from "@/app/lib/errorMapping";

type ProductPlaceholder = { id: string; name: string };

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    emptyListContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.l,
      marginTop: 50,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    errorText: {
        color: theme.colors.error,
        marginBottom: 10,
        textAlign: 'center',
    },
    fieldValue: {
       flexShrink: 1,
       textAlign: "right",
       color: theme.colors.onSurface,
    },
  });

const PreparationScreensScreen = () => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === "open";

  const [filters, setFilters] = useState<FindAllPreparationScreensFilter>({});
  const [pagination, setPagination] = useState<BaseListQuery>({
    page: 1,
    limit: 15,
  });
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: screensData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
    error: errorList,
  } = useGetPreparationScreens(filters, pagination);

  const { mutate: deleteScreenMutate } = useDeletePreparationScreen();

  const deleteScreenWrapper = useCallback(async (id: string): Promise<void> => {
      return new Promise((resolve, reject) => {
          deleteScreenMutate(id, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error),
          });
      });
  }, [deleteScreenMutate]);

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
  } = useCrudScreenLogic<PreparationScreen, any, any>({
    entityName: 'Pantalla de Preparación',
    queryKey: ['preparationScreens', filters, pagination],
    deleteMutationFn: deleteScreenWrapper,
  });

  const selectedScreenId = selectedItem?.id ?? null;

  const {
    data: selectedScreenData,
    isLoading: isLoadingDetail,
  } = useGetPreparationScreenById(selectedScreenId, {
    enabled: !!selectedScreenId && isDetailModalVisible,
  });

  const handleRefresh = useCallback(() => {
    refetchList();
  }, [refetchList]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchTerm(query);
    const timerId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, name: query || undefined }));
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500);
    return () => clearTimeout(timerId);
  }, []);

  const handleFilterChange = useCallback((value: string) => {
    let newIsActive: boolean | undefined;
    if (value === "true") newIsActive = true;
    else if (value === "false") newIsActive = false;
    else newIsActive = undefined;
    setFilters((prev) => ({ ...prev, isActive: newIsActive }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const listRenderConfig = {
    titleField: "name" as keyof PreparationScreen,
    descriptionField: "description" as keyof PreparationScreen,
    statusConfig: {
      field: "isActive" as keyof PreparationScreen,
      activeValue: true,
      activeLabel: "Activa",
      inactiveLabel: "Inactiva",
    },
  };

  const filterOptions: FilterOption<string>[] = [
    { value: "", label: "Todas" },
    { value: "true", label: "Activas" },
    { value: "false", label: "Inactivas" },
  ];

  const detailFields: DisplayFieldConfig<PreparationScreen>[] = [
    {
      field: "products",
      label: "Productos Asociados",
      render: (products) => {
        if (Array.isArray(products) && products.length > 0) {
          return (
            <Text style={styles.fieldValue}>
              {products.map((p: ProductPlaceholder) => p.name).join(", ")}
            </Text>
          );
        }
        return (
          <Text style={styles.fieldValue}>Ninguno</Text>
        );
      },
    },
  ];

  const ListEmptyComponent = useMemo(() => {
    if (isLoadingList && !screensData) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      );
    }
    if (errorList) {
      return (
        <View style={styles.emptyListContainer}>
          <Text style={styles.errorText}>Error al cargar las pantallas: {getApiErrorMessage(errorList)}</Text>
          <Button onPress={handleRefresh}>Reintentar</Button>
        </View>
      );
    }
    if (!isLoadingList && screensData && screensData.length === 0) {
      const message = searchTerm
        ? "No se encontraron pantallas."
        : "No hay pantallas creadas.";
      return (
        <View style={styles.emptyListContainer}>
          <Text>{message}</Text>
        </View>
      );
    }
    return null;
  }, [isLoadingList, errorList, screensData, searchTerm, styles, theme, handleRefresh]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <GenericList<PreparationScreen>
        showImagePlaceholder={false}
        items={screensData ?? []}
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
            ? "true"
            : filters.isActive === false
              ? "false"
              : ""
        }
        onFilterChange={handleFilterChange}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isDetailModalVisible || isFormModalVisible}
        isDrawerOpen={isDrawerOpen}
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
    </SafeAreaView>
  );
};

export default PreparationScreensScreen;
