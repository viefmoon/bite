import React, { useState, useMemo, useCallback } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDrawerStatus } from '@react-navigation/drawer'; // Importar hook
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../../../app/styles/theme';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';
import { getImageUrl } from '../../../app/lib/imageUtils';
import { useListState } from '../../../app/hooks/useListState';
import GenericList from '../../../app/components/crud/GenericList';
import { FilterOption } from '../../../app/components/crud/GenericList';
import GenericDetailModal from '../../../app/components/crud/GenericDetailModal';
import GenericFormModal, {
  FormFieldConfig,
  ImagePickerConfig,
} from '../../../app/components/crud/GenericFormModal';
import {
  ImageUploadService,
  FileObject,
} from '../../../app/lib/imageUploadService';
import categoryService from '../services/categoryService';
import {
  Category,
  CategoryFormData,
  CreateCategoryDto,
  UpdateCategoryDto,
  categoryFormSchema,
} from '../schema/category.schema';

type RootStackParamList = {
  Categories: undefined;
  SubcategoriesScreen: { categoryId: string; categoryName?: string };
};
type CategoriesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Categories'
>;

const CategoriesScreen: React.FC = () => {
  const theme = useAppTheme();
  const queryClient = useQueryClient();
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const drawerStatus = useDrawerStatus(); // Obtener estado del drawer
  const isDrawerOpen = drawerStatus === 'open'; // Determinar si está abierto

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<string | number>('all');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    refetch: refetchCategories,
    isFetching: isFetchingCategories,
  } = useQuery({
    queryKey: ['categories', { filter: activeFilter }],
    queryFn: () =>
      categoryService.getCategories({
        isActive:
          activeFilter === 'all' ? undefined : activeFilter === 'active',
      }),
  });

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingCategories,
    isError: isErrorCategories,
    data: categoriesResponse?.data,
    emptyConfig: {
      title: 'No hay categorías',
      message:
        activeFilter !== 'all'
          ? `No hay categorías ${activeFilter === 'active' ? 'activas' : 'inactivas'} registradas.`
          : 'No hay categorías registradas. Presiona el botón + para crear la primera.',
      icon: 'folder-outline',
    },
  });

  const commonMutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      closeModals();
    },
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error);
      showSnackbar({ message, type: 'error' });
      setIsUploadingImage(false);
    },
  };

  const createCategoryMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) =>
      categoryService.createCategory(data),
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess();
      showSnackbar({
        message: 'Categoría creada exitosamente',
        type: 'success',
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoryService.updateCategory(id, data),
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess();
      showSnackbar({
        message: 'Categoría actualizada exitosamente',
        type: 'success',
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    ...commonMutationOptions,
    onSuccess: () => {
      commonMutationOptions.onSuccess();
      showSnackbar({ message: 'Categoría eliminada', type: 'success' });
    },
  });
  const openAddModal = useCallback(() => {
    setEditingCategory(null);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((category: Category) => {
    setEditingCategory(category);
    setDetailModalVisible(false);
    setModalVisible(true);
  }, []);

  const openDetailModal = useCallback((category: Category) => {
    setSelectedCategory(category);
    setDetailModalVisible(true);
  }, []);

  const closeModals = useCallback(() => {
    setModalVisible(false);
    setDetailModalVisible(false);
    setEditingCategory(null);
    setSelectedCategory(null);
    setIsUploadingImage(false);
  }, []);

  const handleFilterChange = (value: string | number) => {
    setActiveFilter(value);
  };

  const handleFormSubmit = async (
    formData: CategoryFormData,
    photoId: string | null | undefined,
  ) => {
    const { imageUri, ...dataToSubmit } = formData;
    const finalData = {
      ...dataToSubmit,
    };

    // Solo incluir photoId si tiene un valor definido (string o null)
    if (photoId !== undefined) {
      finalData.photoId = photoId;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: finalData as UpdateCategoryDto,
      });
    } else {
      createCategoryMutation.mutate(finalData as CreateCategoryDto);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirmar Eliminación',
      '¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteCategoryMutation.mutate(id),
        },
      ],
    );
  };

  const categories = useMemo(() => {
    const baseCategories = categoriesResponse?.data ?? [];
    const sortedCategories = baseCategories.sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    return sortedCategories;
  }, [categoriesResponse?.data]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
      }),
    [theme],
  );

  const formInitialValues = useMemo((): CategoryFormData => {
    if (editingCategory) {
      return {
        name: editingCategory.name,
        description: editingCategory.description ?? null,
        isActive: editingCategory.isActive,
        imageUri: getImageUrl(editingCategory.photo?.path) ?? null,
      };
    }
    return {
      name: '',
      description: null,
      isActive: true,
      imageUri: null,
    };
  }, [editingCategory]);

  const selectedCategoryMapped = useMemo(() => {
    if (!selectedCategory) return null;
    return selectedCategory;
  }, [selectedCategory]);

  const filterOptions: FilterOption<string | number>[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' },
  ];

  const listRenderConfig = {
    titleField: 'name' as keyof Category,
    descriptionField: 'description' as keyof Category,
    descriptionMaxLength: 60,
    imageField: 'photo' as keyof Category,
    statusConfig: {
      field: 'isActive' as keyof Category,
      activeValue: true,
      activeLabel: 'Activa',
      inactiveLabel: 'Inactiva',
    },
  };

  const formFieldsConfig: FormFieldConfig<CategoryFormData>[] = [
    { name: 'name', label: 'Nombre', type: 'text', required: true },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
      numberOfLines: 3,
    },
    {
      name: 'isActive',
      label: 'Estado',
      type: 'switch',
      switchLabel: 'Activa',
    },
  ];

  const imagePickerConfig: ImagePickerConfig<CategoryFormData> = {
    imageUriField: 'imageUri',
    onImageUpload: async (file: FileObject) => {
      setIsUploadingImage(true);
      try {
        const result = await ImageUploadService.uploadImage(file);
        if (result.success && result.photoId) {
          return { id: result.photoId };
        }
        throw new Error(result.error || 'Error desconocido al subir imagen');
      } finally {
        setIsUploadingImage(false);
      }
    },
    determineFinalPhotoId: ImageUploadService.determinePhotoId,
    imagePickerSize: 150,
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList
        items={categories}
        enableSort={true}
        enableSearch={true}
        searchPlaceholder="Buscar categorías..."
        filterValue={activeFilter}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        renderItemActions={(item: Category) => (
          <IconButton
            icon="format-list-bulleted"
            size={24}
            onPress={() =>
              navigation.navigate('SubcategoriesScreen', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
          />
        )}
        renderConfig={listRenderConfig}
        onItemPress={openDetailModal}
        onRefresh={refetchCategories}
        isRefreshing={isFetchingCategories && !isLoadingCategories}
        ListEmptyComponent={ListEmptyComponent}
        showFab={true}
        onFabPress={openAddModal}
        isModalOpen={modalVisible || detailModalVisible}
        showImagePlaceholder={true}
        isDrawerOpen={isDrawerOpen} // Pasar estado del drawer
      />

      <Portal>
        <GenericFormModal
          visible={modalVisible}
          onDismiss={closeModals}
          onSubmit={handleFormSubmit}
          formSchema={categoryFormSchema}
          formFields={formFieldsConfig}
          imagePickerConfig={imagePickerConfig}
          initialValues={formInitialValues}
          editingItem={editingCategory}
          isSubmitting={
            createCategoryMutation.isPending ||
            updateCategoryMutation.isPending ||
            isUploadingImage
          }
          modalTitle={(isEditing) =>
            isEditing ? 'Editar Categoría' : 'Nueva Categoría'
          }
          submitButtonLabel={(isEditing) => (isEditing ? 'Guardar' : 'Crear')}
        />

        <GenericDetailModal
          visible={detailModalVisible}
          onDismiss={closeModals}
          item={selectedCategoryMapped}
          titleField="name"
          imageField="photo"
          descriptionField="description"
          statusConfig={listRenderConfig.statusConfig}
          onEdit={openEditModal as (item: any) => void}
          onDelete={handleDelete}
          isDeleting={deleteCategoryMutation.isPending}
        />
      </Portal>
    </SafeAreaView>
  );
};

export default CategoriesScreen;
