import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import ConfirmationModal from '../common/ConfirmationModal';
import {
  ImageSection,
  StatusSection,
  DescriptionSection,
  FieldsSection,
  FieldConfig,
} from '../common/DetailModalSections';
import { ActionButtons } from '../common/ActionButtons';

export type DisplayFieldConfig<TItem> = FieldConfig<TItem>;

interface StatusConfig<TItem> {
  field: keyof TItem;
  activeValue: TItem[keyof TItem];
  activeLabel: string;
  inactiveLabel: string;
}

interface GenericDetailModalProps<TItem extends { id: string }> {
  visible: boolean;
  onDismiss: () => void;
  item: TItem | null;

  // Campos principales
  titleField: keyof TItem;
  imageField?: keyof TItem;
  descriptionField?: keyof TItem;
  statusConfig?: StatusConfig<TItem>;
  fieldsToDisplay?: DisplayFieldConfig<TItem>[];
  showImage?: boolean;

  // Acciones
  onEdit?: (item: TItem) => void;
  onDelete?: (id: string) => void | Promise<void>;
  isDeleting?: boolean;

  // Textos personalizables
  editButtonLabel?: string;
  deleteButtonLabel?: string;
  closeButtonLabel?: string;

  // Contenido adicional
  children?: React.ReactNode;
}

function GenericDetailModal<TItem extends { id: string }>({
  visible,
  onDismiss,
  item,
  titleField,
  imageField,
  descriptionField,
  statusConfig,
  fieldsToDisplay = [],
  onEdit,
  onDelete,
  isDeleting = false,
  editButtonLabel = 'Editar',
  deleteButtonLabel = 'Eliminar',
  showImage = false,
  children,
}: GenericDetailModalProps<TItem>) {

  // Estado para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const imageSource = useMemo(() => {
    if (!item || !imageField || !showImage) return null;

    const imageValue = item[imageField];
    if (
      typeof imageValue === 'object' &&
      imageValue !== null &&
      'path' in imageValue
    ) {
      return (imageValue as any).path;
    }
    return typeof imageValue === 'string' ? imageValue : null;
  }, [item, imageField, showImage]);

  const handleEdit = () => {
    if (onEdit && item) {
      onEdit(item);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (onDelete && item) {
      try {
        await onDelete(item.id);
        setShowDeleteConfirm(false);
        onDismiss(); // Cerrar el modal de detalle después de eliminar
      } catch (error) {
        // Si hay error, solo cerrar el modal de confirmación
        setShowDeleteConfirm(false);
      }
    }
  };

  if (!item) {
    return (
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        maxWidthPercent={90}
        maxHeightPercent={90}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      </ResponsiveModal>
    );
  }

  const title = String(item[titleField] ?? '');
  const description = descriptionField
    ? String(item[descriptionField] ?? '')
    : null;

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={!isDeleting}
        maxWidthPercent={90}
        maxHeightPercent={90}
        title={title}
        footer={
          onEdit || onDelete ? (
            <ActionButtons
              buttons={[
                ...(onEdit
                  ? [
                      {
                        icon: 'pencil',
                        label: editButtonLabel,
                        onPress: handleEdit,
                        disabled: isDeleting,
                      },
                    ]
                  : []),
                ...(onDelete
                  ? [
                      {
                        icon: 'delete',
                        label: deleteButtonLabel,
                        mode: 'outlined' as const,
                        onPress: handleDelete,
                        disabled: isDeleting,
                        colorPreset: 'error' as const,
                      },
                    ]
                  : []),
              ]}
            />
          ) : null
        }
      >
        {showImage && <ImageSection source={imageSource} />}

        {statusConfig && item[statusConfig.field] !== undefined && (
          <StatusSection item={item} config={statusConfig} />
        )}

        {description && <DescriptionSection description={description} />}

        <FieldsSection item={item} fields={fieldsToDisplay} />

        {children}
      </ResponsiveModal>

      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este elemento?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmColorPreset="error"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        onDismiss={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GenericDetailModal;
