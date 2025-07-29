import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, IconButton } from 'react-native-paper';
import {
  useFocusEffect,
  useRoute,
  RouteProp,
  useNavigation,
} from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import GenericList from '../../../app/components/crud/GenericList';
import GenericDetailModal from '../../../app/components/crud/GenericDetailModal';
import GenericFormModal, {
  FormFieldConfig,
  ImagePickerConfig,
} from '../../../app/components/crud/GenericFormModal';
import { FilterOption } from '../../../app/components/crud/GenericList';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic';
import { useListState } from '../../../app/hooks/useListState';

import {
  ImageUploadService,
  FileObject,
} from '../../../app/lib/imageUploadService';
import {
  useFindAllSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useRemoveSubcategory,
} from '../hooks/useSubcategoriesQueries';
import { SubCategory } from '@/app/schemas/domain/subcategory.schema';
import {
  createSubCategoryDtoSchema,
  updateSubCategoryDtoSchema,
  SubCategoryFormInputs,
  UpdateSubCategoryFormInputs,
  FindAllSubcategoriesDto,
} from '../schema/subcategory-form.schema';
import { MenuStackParamList } from '@/modules/menu/navigation/types';

type SubcategoriesScreenRouteProp = RouteProp<
  MenuStackParamList,
  'SubcategoriesScreen'
>;
type SubcategoriesScreenNavigationProp = NativeStackNavigationProp<
  MenuStackParamList,
  'SubcategoriesScreen'
>;

type StatusFilter = 'all' | 'active' | 'inactive';

const SubcategoriesScreen: React.FC = () => {
  const theme = useAppTheme();
  const route = useRoute<SubcategoriesScreenRouteProp>();
  const navigation = useNavigation<SubcategoriesScreenNavigationProp>();
  const { categoryId, categoryName } = route.params;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

  const [formInitialValues, setFormInitialValues] = useState<
    SubCategoryFormInputs | UpdateSubCategoryFormInputs
  >({
    name: '',
    description: '',
    isActive: true,
    categoryId: categoryId,
    sortOrder: 0,
    imageUri: null,
  });

  const queryParams = useMemo((): FindAllSubcategoriesDto => {
    let isActive: boolean | undefined;
    if (statusFilter === 'active') isActive = true;
    if (statusFilter === 'inactive') isActive = false;

    const params: FindAllSubcategoriesDto = { categoryId, page: 1, limit: 100 };
    if (isActive !== undefined) {
      params.isActive = isActive;
    }
    return params;
  }, [statusFilter, categoryId]);

  const {
    data: subcategoriesData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
    error: listError,
  } = useFindAllSubcategories(queryParams);

  const createMutation = useCreateSubcategory();
  const updateMutation = useUpdateSubcategory();
  const { mutateAsync: removeSubcategory } = useRemoveSubcategory();

  const {
    isFormModalVisible,
    isDetailModalVisible,
    editingItem,
    selectedItem,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseModals,
  } = useCrudScreenLogic<SubCategory>({
    entityName: 'Subcategoría',
    queryKey: ['subcategories', queryParams],
    deleteMutationFn: removeSubcategory,
  });

  const handleRefresh = useCallback(() => {
    refetchList();
  }, [refetchList]);

  useEffect(() => {
    const loadFormData = async () => {
      if (editingItem) {
        let imageUrl = null;
        if (editingItem.photo?.path) {
          try {
            const { getImageUrl } = await import('@/app/lib/imageUtils');
            imageUrl = await getImageUrl(editingItem.photo.path);
          } catch (error) {
            imageUrl = editingItem.photo.path;
          }
        }

        setFormInitialValues({
          name: editingItem.name,
          description: editingItem.description ?? '',
          isActive: editingItem.isActive,
          categoryId: editingItem.categoryId,
          sortOrder: editingItem.sortOrder ?? 0,
          imageUri: imageUrl,
        });
      } else {
        setFormInitialValues({
          name: '',
          description: '',
          isActive: true,
          categoryId: categoryId,
          sortOrder: 0,
          imageUri: null,
        });
      }
    };

    loadFormData();
  }, [editingItem, categoryId]);

  useFocusEffect(
    useCallback(() => {
      refetchList();
    }, [refetchList]),
  );

  const handleFormSubmit = async (
    formData: SubCategoryFormInputs | UpdateSubCategoryFormInputs,
    photoId: string | null | undefined,
  ) => {
    const { imageUri, ...dataToSubmit } = formData;
    const finalData = {
      ...dataToSubmit,
      ...(photoId !== undefined && { photoId }),
    };

    if (finalData.photoId === undefined && !editingItem) {
      delete (finalData as any).photoId;
    }

    try {
      if (editingItem) {
        await updateMutation.mutateAsync({
          id: editingItem.id,
          data: finalData as UpdateSubCategoryFormInputs,
        });
      } else {
        await createMutation.mutateAsync(finalData as SubCategoryFormInputs);
      }
      handleCloseModals();
    } catch (error) {}
  };

  const listRenderConfig = {
    titleField: 'name' as keyof SubCategory,
    descriptionField: 'description' as keyof SubCategory,
    imageField: 'photo' as keyof SubCategory,
    sortOrderField: 'sortOrder' as keyof SubCategory,
    statusConfig: {
      field: 'isActive' as keyof SubCategory,
      activeValue: true,
      activeLabel: 'Activa',
      inactiveLabel: 'Inactiva',
    },
  };

  const formatDate = (value: string | Date) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const detailFieldsToDisplay: Array<{
    field: keyof SubCategory;
    label: string;
    render?: (value: any) => string;
  }> = [
    {
      field: 'sortOrder',
      label: 'Orden de visualización',
      render: (value) => value ?? '0',
    },
    {
      field: 'createdAt',
      label: 'Fecha de creación',
      render: formatDate,
    },
    {
      field: 'updatedAt',
      label: 'Última actualización',
      render: formatDate,
    },
  ];

  const filterOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' },
  ];

  const formFields: FormFieldConfig<
    SubCategoryFormInputs | UpdateSubCategoryFormInputs
  >[] = [
    { name: 'name', label: 'Nombre *', type: 'text', required: true },
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
      label: 'Activo',
      type: 'switch',
      switchLabel: 'Activo',
      defaultValue: true,
    },
  ];

  const imagePickerConfig: ImagePickerConfig<
    SubCategoryFormInputs | UpdateSubCategoryFormInputs
  > = {
    imageUriField: 'imageUri',
    onImageUpload: async (file: FileObject) => {
      const result = await ImageUploadService.uploadImage(file);
      if (result.success && result.photoId) {
        return { id: result.photoId };
      }
      throw new Error(result.error || 'Error desconocido al subir imagen');
    },
    determineFinalPhotoId: ImageUploadService.determinePhotoId,
    imagePickerSize: 150,
    placeholderIcon: 'folder-open-outline',
    placeholderText: 'Imagen de subcategoría',
  };

  const renderSubcategoryActions = (item: SubCategory) => (
    <IconButton
      icon="chevron-right"
      size={28}
      onPress={() =>
        navigation.navigate('Products', {
          subcategoryId: item.id,
          subCategoryName: item.name,
        })
      }
      style={styles.iconButton}
    />
  );

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingList,
    isError: !!listError,
    data: subcategoriesData?.data,
    emptyConfig: {
      title: 'No hay subcategorías',
      message: `No hay subcategorías registradas para ${categoryName}. Presiona el botón + para crear la primera.`,
      icon: 'folder-outline',
    },
    errorConfig: {
      title: 'Error al cargar subcategorías',
      message: 'No se pudieron cargar las subcategorías. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onRetry: refetchList,
    },
  });

  const handleFilterChange = (value: string | number) => {
    if (value === 'all' || value === 'active' || value === 'inactive') {
      setStatusFilter(value);
    } else {
      setStatusFilter('all');
    }
  };

  return (
    <View style={styles.container}>
      <GenericList<SubCategory>
        items={subcategoriesData?.data ?? []}
        enableSort={true}
        enableSearch={true}
        searchPlaceholder="Buscar subcategorías..."
        filterValue={statusFilter}
        onFilterChange={handleFilterChange}
        filterOptions={filterOptions}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal}
        onRefresh={handleRefresh}
        isRefreshing={isFetchingList && !isLoadingList}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoadingList}
        contentContainerStyle={styles.listContentContainer}
        renderItemActions={renderSubcategoryActions}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isDetailModalVisible || isFormModalVisible}
        showImagePlaceholder={true}
        placeholderIcon="folder-open-outline"
        isDrawerOpen={isDrawerOpen}
      />

      <Portal>
        <GenericDetailModal<SubCategory>
          visible={isDetailModalVisible}
          onDismiss={handleCloseModals}
          item={selectedItem}
          titleField="name"
          imageField="photo"
          descriptionField="description"
          statusConfig={listRenderConfig.statusConfig}
          fieldsToDisplay={detailFieldsToDisplay}
          onEdit={() => {
            if (selectedItem) {
              handleOpenEditModal(selectedItem);
            }
          }}
          onDelete={(id) => removeSubcategory(id)}
          isDeleting={isDeleting}
          showImage={true}
        />

        <GenericFormModal<
          SubCategoryFormInputs | UpdateSubCategoryFormInputs,
          SubCategory
        >
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          onSubmit={handleFormSubmit}
          formSchema={
            editingItem
              ? updateSubCategoryDtoSchema
              : createSubCategoryDtoSchema
          }
          formFields={formFields}
          imagePickerConfig={imagePickerConfig}
          initialValues={formInitialValues}
          editingItem={editingItem}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          modalTitle={(editing) =>
            editing ? 'Editar Subcategoría' : 'Crear Subcategoría'
          }
        />
      </Portal>
    </View>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContentContainer: {
      paddingBottom: 80,
    },
    iconButton: {
      margin: 0,
    },
  });

export default SubcategoriesScreen;
