import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import AutoImage from '../common/AutoImage';
import { useAppTheme, AppTheme } from '../../styles/theme';
import { getImageUrl } from '../../lib/imageUtils';

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
  titleField: keyof TItem;
  imageField?: keyof TItem;
  descriptionField?: keyof TItem;
  statusConfig?: StatusConfig<TItem>;
  fieldsToDisplay?: DisplayFieldConfig<TItem>[];
  onEdit?: (item: TItem) => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
  editButtonLabel?: string;
  deleteButtonLabel?: string;
  closeButtonLabel?: string;
  modalStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  imageStyle?: StyleProp<ViewStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  fieldLabelStyle?: StyleProp<TextStyle>;
  fieldValueStyle?: StyleProp<TextStyle>;
  actionsContainerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalSurface: {
      padding: theme.spacing.l,
      margin: theme.spacing.l,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.elevation.level2,
    },
    modalTitle: {
      marginBottom: theme.spacing.m,
      textAlign: 'center',
      fontWeight: '700',
    },
    detailContent: {
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    detailImage: {
      width: 180,
      height: 180,
      borderRadius: theme.roundness * 1.5,
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    detailDescription: {
      marginBottom: theme.spacing.m,
      textAlign: 'center',
      lineHeight: 22,
    },
    statusChipContainer: {
      marginBottom: theme.spacing.s,
      marginTop: theme.spacing.s,
    },
    statusChip: {
      paddingHorizontal: theme.spacing.s,
      height: 36,
    },
    fieldsContainer: {
      width: '100%',
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      padding: theme.spacing.m,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    lastFieldRow: {
      marginBottom: 0,
      borderBottomWidth: 0,
    },
    fieldLabel: {
      fontWeight: '600',
      marginRight: theme.spacing.s,
      color: theme.colors.onSurfaceVariant,
    },
    fieldValue: {
      flexShrink: 1,
      textAlign: 'right',
      color: theme.colors.onSurface,
    },
    detailActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.m,
      marginTop: theme.spacing.xs,
      width: '100%',
    },
    closeButton: {
      marginTop: theme.spacing.l,
      alignSelf: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      minWidth: 120,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    actionButton: {
      borderRadius: theme.roundness,
      paddingHorizontal: theme.spacing.m,
      flex: 1,
      maxWidth: 150,
    },
  });

const GenericDetailModal = <TItem extends { id: string }>({
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
  modalStyle,
  titleStyle,
  imageStyle,
  descriptionStyle,
  fieldLabelStyle,
  fieldValueStyle,
  actionsContainerStyle,
  children,
}: GenericDetailModalProps<TItem>) => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const handleEdit = () => {
    if (onEdit && item) {
      onEdit(item);
    }
  };

  const handleDelete = () => {
    if (onDelete && item) {
      onDelete(item.id);
    }
  };

  const renderContent = () => {
    if (!item) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator animating={true} size="large" />
        </View>
      );
    }

    const title = String(item[titleField] ?? 'Detalle');
    let imageSource: string | undefined = undefined;
    if (imageField && item.hasOwnProperty(imageField)) {
      const imageFieldValue = item[imageField];
      if (
        typeof imageFieldValue === 'object' &&
        imageFieldValue !== null &&
        'path' in imageFieldValue &&
        typeof imageFieldValue.path === 'string'
      ) {
        const url = getImageUrl(imageFieldValue.path);
        imageSource = url ?? undefined;
      } else if (typeof imageFieldValue === 'string') {
        imageSource = imageFieldValue;
      }
    }
    const description =
      descriptionField && item.hasOwnProperty(descriptionField)
        ? String(item[descriptionField] ?? '')
        : null;

    let statusChip = null;
    if (statusConfig && item.hasOwnProperty(statusConfig.field)) {
      const { field, activeValue, activeLabel, inactiveLabel } = statusConfig;
      const isActive = item[field] === activeValue;
      statusChip = (
        <View style={styles.statusChipContainer}>
          <Chip
            mode="flat"
            selectedColor={
              isActive ? theme.colors.success : theme.colors.onSurfaceVariant
            }
            style={[
              styles.statusChip,
              {
                backgroundColor: isActive
                  ? theme.colors.successContainer
                  : theme.colors.surfaceVariant,
              },
            ]}
          >
            {isActive ? activeLabel : inactiveLabel}
          </Chip>
        </View>
      );
    }

    return (
      <>
        <Text variant="headlineSmall" style={[styles.modalTitle, titleStyle]}>
          {title}
        </Text>
        <View style={styles.detailContent}>
          {imageSource && (
            <AutoImage
              source={imageSource}
              placeholder={require('../../../../assets/icon.png')}
              style={[styles.detailImage, imageStyle]}
              contentFit="contain"
              transition={300}
            />
          )}
          {statusChip}
          {description && (
            <Text style={[styles.detailDescription, descriptionStyle]}>
              {description}
            </Text>
          )}
        </View>

        {fieldsToDisplay.length > 0 && (
          <View style={styles.fieldsContainer}>
            {fieldsToDisplay.map(({ field, label, render }, index) => {
              if (!item || !item.hasOwnProperty(field)) return null;
              const value = item[field];
              const isLastItem = index === fieldsToDisplay.length - 1;

              return (
                <View
                  key={String(field)}
                  style={[styles.fieldRow, isLastItem && styles.lastFieldRow]}
                >
                  <Text style={[styles.fieldLabel, fieldLabelStyle]}>
                    {label}
                  </Text>
                  {render ? (
                    <Text style={[styles.fieldValue, fieldValueStyle]}>
                      {render(value, item)}
                    </Text>
                  ) : (
                    <Text style={[styles.fieldValue, fieldValueStyle]}>
                      {typeof value === 'boolean'
                        ? value
                          ? 'Sí'
                          : 'No'
                        : String(value ?? 'N/A')}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {children}

        {(onEdit || onDelete) && (
          <View style={[styles.detailActions, actionsContainerStyle]}>
            {onEdit && (
              <Button
                icon="pencil"
                mode="contained-tonal"
                onPress={handleEdit}
                disabled={isDeleting}
                style={styles.actionButton}
                buttonColor={theme.colors.secondaryContainer}
                textColor={theme.colors.onSecondaryContainer}
              >
                {editButtonLabel}
              </Button>
            )}
            {onDelete && (
              <Button
                icon="delete"
                mode="contained-tonal"
                buttonColor={theme.colors.errorContainer}
                textColor={theme.colors.error}
                onPress={handleDelete}
                loading={isDeleting}
                disabled={isDeleting}
                style={styles.actionButton}
              >
                {deleteButtonLabel}
              </Button>
            )}
          </View>
        )}

        <Button
          mode="contained-tonal"
          onPress={onDismiss}
          style={styles.closeButton}
          disabled={isDeleting}
          buttonColor={theme.colors.surfaceVariant}
          textColor={theme.colors.onSurfaceVariant}
        >
          {closeButtonLabel}
        </Button>
      </>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modalSurface, modalStyle]}
        dismissable={!isDeleting}
      >
        {renderContent()}
      </Modal>
    </Portal>
  );
};

export default GenericDetailModal;
