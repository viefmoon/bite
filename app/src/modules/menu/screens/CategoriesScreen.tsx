import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDrawerStatus } from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, IconButton } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import { useAppTheme } from '../../../app/styles/theme';
import { useSnackbarStore } from '../../../app/store/snackbarStore';
import { getApiErrorMessage } from '../../../app/lib/errorMapping';
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
import { useRefreshModuleOnFocus } from '../../../app/hooks/useRefreshOnFocus';

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
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [activeFilter, setActiveFilter] = useState<string | number>('all');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

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

  // Refrescar categorías cuando la pantalla recibe foco

  useRefreshModuleOnFocus('categories');

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
    errorConfig: {
      title: 'Error al cargar categorías',
      message: 'No se pudieron cargar las categorías. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onRetry: refetchCategories,
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
    const finalData: any = {
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
    setCategoryToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryMutation.mutate(categoryToDelete);
      setShowDeleteConfirmation(false);
      setCategoryToDelete(null);
    }
  };

  const categories = useMemo(() => {
    return categoriesResponse?.data ?? [];
  }, [categoriesResponse?.data]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.colors.background },
      }),
    [theme],
  );

  const [formInitialValues, setFormInitialValues] = useState<CategoryFormData>({
    name: '',
    description: null,
    isActive: true,
    sortOrder: 0,
    imageUri: null,
  });

  useEffect(() => {
    const loadFormData = async () => {
      if (editingCategory) {
        let imageUrl = null;
        if (editingCategory.photo?.path) {
          try {
            const { getImageUrl } = await import('@/app/lib/imageUtils');
            imageUrl = await getImageUrl(editingCategory.photo.path);
          } catch (error) {
            console.error('Error al obtener URL de imagen:', error);
            imageUrl = editingCategory.photo.path;
          }
        }
        
        setFormInitialValues({
          name: editingCategory.name,
          description: editingCategory.description ?? null,
          isActive: editingCategory.isActive,
          sortOrder: editingCategory.sortOrder ?? 0,
          imageUri: imageUrl,
        });
      } else {
        setFormInitialValues({
          name: '',
          description: null,
          isActive: true,
          sortOrder: 0,
          imageUri: null,
        });
      }
    };
    
    loadFormData();
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
    sortOrderField: 'sortOrder' as keyof Category,
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
      name: 'sortOrder',
      label: 'Orden de visualización',
      type: 'number',
      placeholder: '0',
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
    placeholderIcon: 'folder-outline',
    placeholderText: 'Imagen de categoría',
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
            size={28}
            onPress={() =>
              navigation.navigate('SubcategoriesScreen', {
                categoryId: item.id,
                categoryName: item.name,
              })
            }
            style={{ margin: 0 }}
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
        placeholderIcon="folder-outline"
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
          fieldsToDisplay={[
            {
              field: 'sortOrder',
              label: 'Orden de visualización',
              render: (value) => value ?? '0',
            },
            {
              field: 'createdAt',
              label: 'Fecha de creación',
              render: (value) => {
                if (!value) return 'N/A';
                const date = new Date(value as string);
                return date.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },
            },
            {
              field: 'updatedAt',
              label: 'Última actualización',
              render: (value) => {
                if (!value) return 'N/A';
                const date = new Date(value as string);
                return date.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
              },
            },
          ]}
          onEdit={openEditModal as (item: any) => void}
          onDelete={handleDelete}
          isDeleting={deleteCategoryMutation.isPending}
          showImage={true}
        />

        <ConfirmationModal
          visible={showDeleteConfirmation}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar esta categoría? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmButtonColor={theme.colors.error}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setShowDeleteConfirmation(false);
            setCategoryToDelete(null);
          }}
          onDismiss={() => {
            setShowDeleteConfirmation(false);
            setCategoryToDelete(null);
          }}
        />
      </Portal>
    </SafeAreaView>
  );
};

export default CategoriesScreen;
