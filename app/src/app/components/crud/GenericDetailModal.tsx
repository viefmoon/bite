import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import AutoImage from '../common/AutoImage';
import { useAppTheme } from '../../styles/theme';
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import { useResponsive } from '../../hooks/useResponsive';
import ConfirmationModal from '../common/ConfirmationModal';

export interface DisplayFieldConfig<TItem> {
  field: keyof TItem;
  label: string;
  render?: (value: TItem[keyof TItem], item: TItem) => React.ReactNode;
}

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
  onDelete?: (id: string) => void;
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
  closeButtonLabel = 'Cerrar',
  showImage = false,
  children,
}: GenericDetailModalProps<TItem>) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  
  // Estado para confirmación de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  // Extraer imagen si existe
  const imageSource = useMemo(() => {
    if (!item || !imageField || !showImage) return null;
    
    const imageValue = item[imageField];
    if (typeof imageValue === 'object' && imageValue !== null && 'path' in imageValue) {
      return (imageValue as any).path;
    }
    return typeof imageValue === 'string' ? imageValue : null;
  }, [item, imageField, showImage]);

  // Manejadores
  const handleEdit = () => {
    if (onEdit && item) {
      onEdit(item);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete && item) {
      onDelete(item.id);
      setShowDeleteConfirm(false);
    }
  };

  if (!item) {
    return (
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        maxWidth={responsive.isTablet ? 480 : 400}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating size="large" />
        </View>
      </ResponsiveModal>
    );
  }

  const title = String(item[titleField] ?? '');
  const description = descriptionField ? String(item[descriptionField] ?? '') : null;

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={!isDeleting}
        maxWidth={responsive.isTablet ? 480 : 400}
        maxHeight="85%"
      >
        {/* Header con botón cerrar */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeIcon}
          />
        </View>

        {/* Imagen */}
        {showImage && imageSource && (
          <AutoImage
            source={imageSource}
            placeholderIcon="image-outline"
            style={styles.image}
            contentFit="contain"
          />
        )}

        {/* Estado */}
        {statusConfig && item[statusConfig.field] !== undefined && (
          <View style={styles.statusContainer}>
            <Chip
              mode="flat"
              style={[
                styles.statusChip,
                {
                  backgroundColor: item[statusConfig.field] === statusConfig.activeValue
                    ? theme.colors.successContainer
                    : theme.colors.surfaceVariant,
                }
              ]}
            >
              {item[statusConfig.field] === statusConfig.activeValue
                ? statusConfig.activeLabel
                : statusConfig.inactiveLabel}
            </Chip>
          </View>
        )}

        {/* Descripción */}
        {description && (
          <Text style={styles.description} numberOfLines={4}>
            {description}
          </Text>
        )}

        {/* Campos adicionales */}
        {fieldsToDisplay.length > 0 && (
          <View style={styles.fieldsContainer}>
            {fieldsToDisplay.map(({ field, label, render }) => {
              const value = item[field];
              return (
                <View key={String(field)} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{label}:</Text>
                  <Text style={styles.fieldValue} numberOfLines={2}>
                    {render 
                      ? render(value, item) 
                      : typeof value === 'boolean' 
                        ? (value ? 'Sí' : 'No')
                        : String(value ?? 'N/A')
                    }
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Contenido adicional */}
        {children}

        {/* Acciones */}
        <View style={styles.actions}>
          {(onEdit || onDelete) && (
            <View style={styles.actionButtons}>
              {onEdit && (
                <Button
                  icon="pencil"
                  mode="contained-tonal"
                  onPress={handleEdit}
                  disabled={isDeleting}
                  style={styles.actionButton}
                  compact
                >
                  {editButtonLabel}
                </Button>
              )}
              {onDelete && (
                <Button
                  icon="delete"
                  mode="contained-tonal"
                  onPress={handleDelete}
                  loading={isDeleting}
                  disabled={isDeleting}
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.errorContainer }
                  ]}
                  textColor={theme.colors.error}
                  compact
                >
                  {deleteButtonLabel}
                </Button>
              )}
            </View>
          )}
          
          <Button
            mode="text"
            onPress={onDismiss}
            disabled={isDeleting}
            style={styles.closeButton}
          >
            {closeButtonLabel}
          </Button>
        </View>
      </ResponsiveModal>

      <ConfirmationModal
        visible={showDeleteConfirm}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este elemento?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmButtonColor={theme.colors.error}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    fontWeight: '600',
  },
  closeIcon: {
    margin: -8,
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: 'center',
    borderRadius: 12,
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusChip: {
    paddingHorizontal: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 14,
    lineHeight: 20,
  },
  fieldsContainer: {
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  fieldLabel: {
    fontWeight: '500',
    flex: 1,
  },
  fieldValue: {
    flex: 1,
    textAlign: 'right',
    color: 'rgba(0,0,0,0.7)',
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  closeButton: {
    alignSelf: 'center',
  },
});

export default GenericDetailModal;