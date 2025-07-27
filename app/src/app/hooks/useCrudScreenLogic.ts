import { useState, useCallback } from 'react';
import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';

interface CrudLogicParams {
  entityName: string;
  queryKey: QueryKey;
  deleteMutationFn: (id: string) => Promise<void>;
}

export function useCrudScreenLogic<TItem extends { id: string }>({
  entityName,
  queryKey,
  deleteMutationFn,
}: CrudLogicParams) {
  const queryClient = useQueryClient();
  const showSnackbar = useSnackbarStore((s) => s.showSnackbar);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<TItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<TItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: deleteMutationFn,
    onSuccess: (_, _deletedId) => {
      queryClient.invalidateQueries({ queryKey });
      showSnackbar({
        message: `${entityName} eliminado con éxito`,
        type: 'success',
      });
      handleCloseModals();
    },
    onError: (error) => {
      showSnackbar({
        message: `Error al eliminar ${entityName}: ${getApiErrorMessage(error)}`,
        type: 'error',
      });
    },
  });

  const handleOpenCreateModal = useCallback(() => {
    setEditingItem(null);
    setSelectedItem(null);
    setIsFormModalVisible(true);
    setIsDetailModalVisible(false);
  }, []);

  const handleOpenEditModal = useCallback((item: TItem) => {
    setEditingItem(item);
    setSelectedItem(null);
    setIsFormModalVisible(true);
    setIsDetailModalVisible(false);
  }, []);

  const handleOpenDetailModal = useCallback((item: TItem) => {
    setSelectedItem(item);
    setEditingItem(null);
    setIsDetailModalVisible(true);
    setIsFormModalVisible(false);
  }, []);

  const handleCloseModals = useCallback(() => {
    setIsFormModalVisible(false);
    setIsDetailModalVisible(false);
    setEditingItem(null);
    setSelectedItem(null);
  }, []);

  // Alternative deletion methods for use with ConfirmationModal
  const [deleteConfirmationState, setDeleteConfirmationState] = useState<{
    visible: boolean;
    itemId: string | null;
  }>({
    visible: false,
    itemId: null,
  });

  const showDeleteConfirmation = useCallback((id: string) => {
    setDeleteConfirmationState({ visible: true, itemId: id });
  }, []);

  const hideDeleteConfirmation = useCallback(() => {
    setDeleteConfirmationState({ visible: false, itemId: null });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteConfirmationState.itemId) {
      deleteMutation.mutate(deleteConfirmationState.itemId);
      hideDeleteConfirmation();
    }
  }, [deleteConfirmationState.itemId, deleteMutation, hideDeleteConfirmation]);

  return {
    isFormModalVisible,
    isDetailModalVisible,
    editingItem,
    selectedItem,
    isDeleting: deleteMutation.isPending,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseModals,
    // Properties for ConfirmationModal integration
    deleteConfirmation: {
      visible: deleteConfirmationState.visible,
      title: 'Confirmar Eliminación',
      message: `¿Estás seguro de que deseas eliminar este ${entityName.toLowerCase()}?`,
      onConfirm: confirmDelete,
      onCancel: hideDeleteConfirmation,
      show: showDeleteConfirmation,
    },
  };
}
