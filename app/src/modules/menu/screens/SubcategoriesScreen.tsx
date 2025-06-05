import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, IconButton } from 'react-native-paper';
import { useFocusEffect, useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { useDrawerStatus } from '@react-navigation/drawer';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import GenericList from '../../../app/components/crud/GenericList';
import GenericDetailModal from '../../../app/components/crud/GenericDetailModal';
import GenericFormModal, { FormFieldConfig, ImagePickerConfig } from '../../../app/components/crud/GenericFormModal';
import { FilterOption } from '../../../app/components/crud/GenericList';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic';
import { useListState } from '../../../app/hooks/useListState';

import { ImageUploadService, FileObject } from '../../../app/lib/imageUploadService';
import {
  useFindAllSubcategories,
  useCreateSubcategory,
  useUpdateSubcategory,
  useRemoveSubcategory,
} from '../hooks/useSubcategoriesQueries';
import {
  SubCategory,
  createSubCategoryDtoSchema,
  updateSubCategoryDtoSchema,
  SubCategoryFormInputs,
  UpdateSubCategoryFormInputs,
  findAllSubcategoriesDtoSchema,
} from '../schema/subcategories.schema';
import { z } from 'zod';
import { getImageUrl } from '../../../app/lib/imageUtils';
import { MenuStackParamList } from '@/modules/menu/navigation/types';

type SubcategoriesScreenRouteProp = RouteProp<MenuStackParamList, 'SubcategoriesScreen'>;
type SubcategoriesScreenNavigationProp = NativeStackNavigationProp<MenuStackParamList, 'SubcategoriesScreen'>;

type StatusFilter = 'all' | 'active' | 'inactive';
type FindAllSubcategoriesDto = z.infer<typeof findAllSubcategoriesDtoSchema>;

const SubcategoriesScreen: React.FC = () => {
  const theme = useAppTheme();
  const route = useRoute<SubcategoriesScreenRouteProp>();
  const navigation = useNavigation<SubcategoriesScreenNavigationProp>();
  const { categoryId, categoryName } = route.params;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>('all');

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
    isDeleting,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseModals,
    handleDeleteItem,
  } = useCrudScreenLogic<SubCategory>({
    entityName: 'Subcategoría',
    queryKey: ['subcategories', queryParams],
    deleteMutationFn: removeSubcategory,
  });

  const handleRefresh = useCallback(() => {
    refetchList();
  }, [refetchList]);

  useFocusEffect(
    useCallback(() => {
      refetchList();
    }, [refetchList])
  );

  const handleFormSubmit = async (
    formData: SubCategoryFormInputs | UpdateSubCategoryFormInputs,
    photoId: string | null | undefined
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
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const listRenderConfig = {
    titleField: 'name' as keyof SubCategory,
    descriptionField: 'description' as keyof SubCategory,
    imageField: 'photo' as keyof SubCategory,
    statusConfig: {
      field: 'isActive' as keyof SubCategory,
      activeValue: true,
      activeLabel: 'Activa',
      inactiveLabel: 'Inactiva',
    },
  };

  const detailFieldsToDisplay: Array<{ field: keyof SubCategory; label: string }> = [];

  const filterOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' },
  ];

  const formFields: FormFieldConfig<SubCategoryFormInputs | UpdateSubCategoryFormInputs>[] = [
    { name: 'name', label: 'Nombre *', type: 'text', required: true },
    { name: 'description', label: 'Descripción', type: 'textarea', numberOfLines: 3 },
    { name: 'isActive', label: 'Activo', type: 'switch', switchLabel: 'Activo', defaultValue: true },
  ];

  const imagePickerConfig: ImagePickerConfig<SubCategoryFormInputs | UpdateSubCategoryFormInputs> = { // Eliminado segundo tipo genérico
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
  };

  const renderSubcategoryActions = (item: SubCategory) => (
    <IconButton
      icon="chevron-right"
      size={24}
      onPress={() => navigation.navigate('Products', { subcategoryId: item.id, subCategoryName: item.name })}
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
        listStyle={styles.listStyle}
        renderItemActions={renderSubcategoryActions}
        showFab={true}
        onFabPress={handleOpenCreateModal}
        isModalOpen={isDetailModalVisible || isFormModalVisible}
        showImagePlaceholder={true}
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
          onDelete={handleDeleteItem}
          isDeleting={isDeleting}
        />

        <GenericFormModal<SubCategoryFormInputs | UpdateSubCategoryFormInputs, SubCategory>
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          onSubmit={handleFormSubmit}
          formSchema={editingItem ? updateSubCategoryDtoSchema : createSubCategoryDtoSchema} // Corregido nombre de schema
          formFields={formFields}
          imagePickerConfig={imagePickerConfig}
          initialValues={
            editingItem
              ? {
                  name: editingItem.name,
                  description: editingItem.description ?? '',
                  isActive: editingItem.isActive,
                  categoryId: editingItem.categoryId,
                  imageUri: editingItem.photo?.path ? getImageUrl(editingItem.photo.path) : null,
                }
              : {
                  name: '',
                  description: '',
                  isActive: true,
                  categoryId: categoryId,
                  imageUri: null,
                }
          }
          editingItem={editingItem}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          modalTitle={(editing) => editing ? 'Editar Subcategoría' : 'Crear Subcategoría'}
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
    listStyle: {
      flex: 1,
    },
    listContentContainer: {
      paddingBottom: 80,
    },
  });

export default SubcategoriesScreen;