import React, { useMemo, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Text, Portal } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { useDrawerStatus } from '@react-navigation/drawer';
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/react-query";

import {
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../hooks/useProductsQueries";
import { Product, ProductFormInputs } from "../schema/products.schema";
import { MenuStackParamList } from "@/modules/menu/navigation/types";
import { useAppTheme, AppTheme } from "@/app/styles/theme";
import { getApiErrorMessage } from "@/app/lib/errorMapping";
import GenericList, { FilterOption } from "@/app/components/crud/GenericList";
import ProductFormModal from "../components/ProductFormModal";
import { useSnackbarStore } from "@/app/store/snackbarStore";
import { FileObject } from "@/app/components/common/CustomImagePicker";
import { useCrudScreenLogic } from "@/app/hooks/useCrudScreenLogic";

type ProductsScreenRouteProp = RouteProp<MenuStackParamList, "Products">;

function ProductsScreen(): JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme as AppTheme), [theme]);
  const navigation = useNavigation();
  const route = useRoute<ProductsScreenRouteProp>();
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const { subcategoryId, subCategoryName } = route.params;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const debouncedSetSearch = useCallback(
    debounce((query: string) => setDebouncedSearchQuery(query), 300),
    []
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  const handleFilterChange = (value: string | number) => {
    if (value === "all" || value === "active" || value === "inactive") {
        setStatusFilter(value);
    } else {
        console.warn("Valor de filtro inesperado:", value);
        setStatusFilter("all");
    }
  };

  const queryFilters = useMemo(
    () => ({
      subcategoryId: subcategoryId,
      search: debouncedSearchQuery || undefined,
      limit: 20,
      page: 1,
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    }),
    [subcategoryId, debouncedSearchQuery, statusFilter]
  );

  const {
    data: productsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useProductsQuery(queryFilters, {});

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const { mutateAsync: deleteProduct } = useDeleteProductMutation();

  const {
    isFormModalVisible,
    editingItem,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModals,
  } = useCrudScreenLogic<Product, ProductFormInputs, ProductFormInputs>({
    entityName: 'Producto',
    queryKey: ["products", queryFilters],
    deleteMutationFn: deleteProduct,
  });


  const products = useMemo(() => {
    return (productsResponse?.[0] ?? []).map((p: Product) => ({ // Añadido tipo explícito
      ...p,
      _displayDescription: p.hasVariants
        ? `${p.variants?.length || 0} variante(s)`
        : !isNaN(parseFloat(String(p.price)))
          ? `$${parseFloat(String(p.price)).toFixed(2)}`
          : "Precio no definido",
    }));
  }, [productsResponse]);

  const handleFormSubmit = useCallback(
    async (
      formData: ProductFormInputs,
      photoId: string | null | undefined,
      _file?: FileObject | null
    ) => {
      const isEditing = !!editingItem;

      const { imageUri, ...dataToSend } = formData;

      const mutationData = {
        ...dataToSend,
        modifierGroupIds: dataToSend.modifierGroupIds ?? [],
        ...(photoId !== undefined && { photoId: photoId }),
      };

      try {
        const handleMutationSuccess = (createdOrUpdatedProduct: Product) => {
          const message = isEditing
            ? "Producto actualizado con éxito"
            : "Producto creado con éxito";

          showSnackbar({ message, type: "success" });

          handleCloseModals();
          queryClient.invalidateQueries({
            queryKey: ["products", queryFilters],
          });
          if (createdOrUpdatedProduct?.id) {
            queryClient.invalidateQueries({
              queryKey: ["product", createdOrUpdatedProduct.id],
            });
          }
        };

        const handleMutationError = (err: unknown) => {
          showSnackbar({
            message: `Error al ${isEditing ? "actualizar" : "crear"} producto: ${getApiErrorMessage(err)}`,
            type: "error",
          });
        };

        if (isEditing && editingItem) {
          await updateMutation.mutateAsync(
            { id: editingItem.id, data: mutationData },
            {
              onSuccess: handleMutationSuccess,
              onError: handleMutationError,
            }
          );
        } else {
          await createMutation.mutateAsync(mutationData, {
            onSuccess: handleMutationSuccess,
            onError: handleMutationError,
          });
        }
      } catch (err) {
        console.error("Unexpected error during form submission:", err);
        showSnackbar({ message: "Ocurrió un error inesperado", type: "error" });
      }
    },
    [
      editingItem,
      updateMutation,
      createMutation,
      showSnackbar,
      handleCloseModals,
      queryClient,
      queryFilters,
    ]
  );

  const listRenderConfig = {
    titleField: "name" as keyof Product,
    descriptionField: "_displayDescription" as keyof (Product & {
      _displayDescription: string;
    }),
    imageField: "photo" as keyof Product,
    statusConfig: {
      field: "isActive" as keyof Product,
      activeValue: true,
      activeLabel: "Activo",
      inactiveLabel: "Inactivo",
    },
  };

  const filterOptions: FilterOption<"all" | "active" | "inactive">[] = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Activos" },
    { value: "inactive", label: "Inactivos" },
  ];

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.centered}>
        {isLoading ? (
          <ActivityIndicator
            animating={true}
            color={theme.colors.primary}
            size="large"
          />
        ) : error ? (
          <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
        ) : (
          <Text>
            {debouncedSearchQuery
              ? `No se encontraron productos para "${debouncedSearchQuery}"`
              : `No hay productos en "${subCategoryName}".`}
          </Text>
        )}
      </View>
    ),
    [
      isLoading,
      error,
      subCategoryName,
      styles,
      theme.colors.primary,
      debouncedSearchQuery,
    ]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: subCategoryName ? `Productos de ${subCategoryName}` : "Productos",
    });
  }, [navigation, subCategoryName]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom", "left", "right"]}>
      <GenericList<Product & { _displayDescription: string }>
        items={products}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenEditModal}
        onRefresh={refetch}
        isRefreshing={isFetching && !isLoading}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoading && !isFetching}
        filterValue={statusFilter}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        enableSearch={true}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar productos..."
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isFormModalVisible}
        enableSort={false}
        contentContainerStyle={styles.contentContainer}
        showImagePlaceholder={true}
        isDrawerOpen={isDrawerOpen}
      />

      <Portal>
        <ProductFormModal
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          onSubmit={handleFormSubmit}
          initialData={editingItem}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          productId={editingItem?.id}
          subcategoryId={subcategoryId}
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
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.l,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: "center",
    },
    contentContainer: {
      paddingBottom: 80,
    },
  });

export default ProductsScreen;
