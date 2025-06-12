import React, { useMemo, useCallback, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Portal } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { debounce } from 'lodash';
import { useQueryClient } from '@tanstack/react-query';

import {
  usePizzaIngredients,
  useCreatePizzaIngredient,
  useUpdatePizzaIngredient,
  useDeletePizzaIngredient,
} from '../hooks/usePizzaIngredientsQueries';
import { PizzaIngredient } from '../types/pizzaIngredient.types';
import {
  PizzaIngredientFormInputs,
  pizzaIngredientFormSchema,
} from '../schema/pizzaIngredient.schema';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import GenericList, { FilterOption } from '@/app/components/crud/GenericList';
import GenericFormModal, {
  FormFieldConfig,
} from '@/app/components/crud/GenericFormModal';
import GenericDetailModal from '@/app/components/crud/GenericDetailModal';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useCrudScreenLogic } from '@/app/hooks/useCrudScreenLogic';
import { useListState } from '@/app/hooks/useListState';

function PizzaIngredientsScreen(): JSX.Element {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme as AppTheme), [theme]);
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] =
    useState<PizzaIngredient | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const debouncedSetSearch = useCallback(
    debounce((query: string) => setDebouncedSearchQuery(query), 300),
    [],
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSetSearch(query);
  };

  const handleFilterChange = (value: string | number) => {
    if (value === 'all' || value === 'active' || value === 'inactive') {
      setStatusFilter(value);
    } else {
      setStatusFilter('all');
    }
  };

  const queryFilters = useMemo(
    () => ({
      search: debouncedSearchQuery || undefined,
      limit: 20,
      page: 1,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    }),
    [debouncedSearchQuery, statusFilter],
  );

  const {
    data: pizzaIngredientsResponse,
    isLoading,
    error,
    refetch,
    isFetching,
  } = usePizzaIngredients(queryFilters);

  const createMutation = useCreatePizzaIngredient();
  const updateMutation = useUpdatePizzaIngredient();
  const { mutateAsync: deleteIngredient } = useDeletePizzaIngredient();

  const {
    isFormModalVisible,
    editingItem,
    handleOpenCreateModal,
    handleOpenEditModal: originalHandleOpenEditModal,
    handleCloseModals: originalHandleCloseModals,
  } = useCrudScreenLogic<PizzaIngredient>({
    entityName: 'Ingrediente de Pizza',
    queryKey: ['pizzaIngredients', queryFilters],
    deleteMutationFn: deleteIngredient,
  });

  const handleOpenEditModal = useCallback(
    (item: PizzaIngredient) => {
      setDetailModalVisible(false);
      originalHandleOpenEditModal(item);
    },
    [originalHandleOpenEditModal],
  );

  const handleOpenDetailModal = useCallback((item: PizzaIngredient) => {
    setSelectedIngredient(item);
    setDetailModalVisible(true);
  }, []);

  const handleCloseModals = useCallback(() => {
    originalHandleCloseModals();
    setDetailModalVisible(false);
    setSelectedIngredient(null);
  }, [originalHandleCloseModals]);

  const pizzaIngredients = useMemo(() => {
    return (pizzaIngredientsResponse?.data ?? []).map(
      (ingredient: PizzaIngredient) => ({
        ...ingredient,
        _displayDescription: `Valor: ${ingredient.ingredientValue}`,
      }),
    );
  }, [pizzaIngredientsResponse]);

  const handleFormSubmit = useCallback(
    async (formData: PizzaIngredientFormInputs) => {
      const isEditing = !!editingItem;

      try {
        if (isEditing && editingItem) {
          await updateMutation.mutateAsync({
            id: editingItem.id,
            data: formData,
          });
          showSnackbar({
            message: 'Ingrediente de pizza actualizado con éxito',
            type: 'success',
          });
        } else {
          await createMutation.mutateAsync(formData);
          showSnackbar({
            message: 'Ingrediente de pizza creado con éxito',
            type: 'success',
          });
        }

        handleCloseModals();
        queryClient.invalidateQueries({
          queryKey: ['pizzaIngredients', queryFilters],
        });
      } catch (err: any) {
        showSnackbar({
          message: `Error al ${isEditing ? 'actualizar' : 'crear'} ingrediente: ${err.message}`,
          type: 'error',
        });
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
    ],
  );

  const handleDelete = useCallback(
    (id: string) => {
      Alert.alert(
        'Confirmar Eliminación',
        '¿Estás seguro de que quieres eliminar este ingrediente? Esta acción no se puede deshacer.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteIngredient(id);
                showSnackbar({
                  message: 'Ingrediente eliminado con éxito',
                  type: 'success',
                });
                setDetailModalVisible(false);
              } catch (error) {
                showSnackbar({
                  message: 'Error al eliminar el ingrediente',
                  type: 'error',
                });
              }
            },
          },
        ],
      );
    },
    [deleteIngredient, showSnackbar],
  );

  const formFieldsConfig: FormFieldConfig<PizzaIngredientFormInputs>[] =
    useMemo(
      () => [
        {
          name: 'name',
          label: 'Nombre del Ingrediente',
          type: 'text',
          placeholder: 'Ej: Pepperoni',
          required: true,
        },
        {
          name: 'ingredientValue',
          label: 'Valor del Ingrediente',
          type: 'number',
          placeholder: '1',
          defaultValue: 1,
          required: true,
        },
        {
          name: 'ingredients',
          label: 'Ingredientes/Descripción',
          type: 'textarea',
          placeholder: 'Ej: Pork, beef, spices...',
          numberOfLines: 3,
          required: false,
        },
        {
          name: 'isActive',
          label: 'Estado',
          type: 'switch',
          switchLabel: 'Ingrediente activo',
          defaultValue: true,
        },
      ],
      [],
    );

  const formInitialValues = useMemo(() => {
    if (editingItem) {
      return {
        name: editingItem.name,
        ingredientValue: editingItem.ingredientValue,
        ingredients: editingItem.ingredients || '',
        isActive: editingItem.isActive,
      };
    }
    return {
      name: '',
      ingredientValue: 1,
      ingredients: '',
      isActive: true,
    };
  }, [editingItem]);

  const listRenderConfig = {
    titleField: 'name' as keyof PizzaIngredient,
    descriptionField: '_displayDescription' as keyof (PizzaIngredient & {
      _displayDescription: string;
    }),
    statusConfig: {
      field: 'isActive' as keyof PizzaIngredient,
      activeValue: true,
      activeLabel: 'Activo',
      inactiveLabel: 'Inactivo',
    },
  };

  const filterOptions: FilterOption<'all' | 'active' | 'inactive'>[] = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Activos' },
    { value: 'inactive', label: 'Inactivos' },
  ];

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError: !!error,
    data: pizzaIngredients,
    emptyConfig: {
      title: debouncedSearchQuery
        ? `No se encontraron ingredientes`
        : 'No hay ingredientes de pizza',
      message: debouncedSearchQuery
        ? `No se encontraron ingredientes para "${debouncedSearchQuery}"`
        : `No hay ingredientes de pizza registrados. Presiona el botón + para crear el primero.`,
      icon: 'pizza',
    },
  });

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Ingredientes de Pizza',
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<PizzaIngredient & { _displayDescription: string }>
        items={pizzaIngredients}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal}
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
        searchPlaceholder="Buscar ingredientes..."
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isFormModalVisible}
        enableSort={false}
        contentContainerStyle={styles.contentContainer}
        showImagePlaceholder={false}
        isDrawerOpen={isDrawerOpen}
      />

      <Portal>
        <GenericFormModal
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          onSubmit={handleFormSubmit}
          formSchema={pizzaIngredientFormSchema}
          formFields={formFieldsConfig}
          initialValues={formInitialValues}
          editingItem={editingItem}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          modalTitle={(isEditing) =>
            isEditing ? 'Editar Ingrediente' : 'Nuevo Ingrediente'
          }
          submitButtonLabel={(isEditing) => (isEditing ? 'Guardar' : 'Crear')}
        />

        <GenericDetailModal
          visible={detailModalVisible}
          onDismiss={() => setDetailModalVisible(false)}
          item={selectedIngredient}
          titleField="name"
          descriptionField="ingredients"
          statusConfig={listRenderConfig.statusConfig}
          onEdit={handleOpenEditModal}
          onDelete={handleDelete}
          isDeleting={false}
          additionalDetails={[
            {
              label: 'Valor',
              value: selectedIngredient?.ingredientValue?.toString() || 'N/A',
            },
          ]}
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
    contentContainer: {
      paddingBottom: 80,
    },
  });

export default PizzaIngredientsScreen;
