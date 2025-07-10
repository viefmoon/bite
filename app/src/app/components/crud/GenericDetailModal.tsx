import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import AutoImage from '../common/AutoImage';
import { useAppTheme, AppTheme } from '../../styles/theme';
import { getImageUrl } from '../../lib/imageUtils';
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import { useResponsive } from '../../hooks/useResponsive';

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
  showImage?: boolean;
  children?: React.ReactNode;
}

const getStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    modalSurface: {
      padding: responsive.spacing.xl,
      margin: responsive.spacing.m,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.elevation.level2,
      maxWidth: 500,
      alignSelf: 'center',
      width: '90%',
    },
    modalTitle: {
      marginBottom: responsive.spacing.l,
      textAlign: 'center',
      fontWeight: '700',
      fontSize: 24,
    },
    detailContent: {
      alignItems: 'center',
      marginBottom: responsive.spacing.m,
    },
    detailImage: {
      width: responsive.getResponsiveDimension(150, 200),
      height: responsive.getResponsiveDimension(150, 200),
      borderRadius: theme.roundness * 1.5,
      marginBottom: responsive.spacing.m,
      backgroundColor: theme.colors.surfaceDisabled,
    },
    detailDescription: {
      marginBottom: responsive.spacing.m,
      textAlign: 'center',
      lineHeight: 22,
    },
    statusChipContainer: {
      marginBottom: responsive.spacing.m,
      marginTop: responsive.spacing.m,
    },
    statusChip: {
      paddingHorizontal: responsive.spacing.s,
      height: 36,
    },
    fieldsContainer: {
      width: '100%',
      marginBottom: responsive.spacing.l,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 1.5,
      padding: responsive.spacing.l,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: responsive.spacing.m,
      paddingVertical: responsive.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    lastFieldRow: {
      marginBottom: 0,
      borderBottomWidth: 0,
    },
    fieldLabel: {
      fontWeight: '600',
      marginRight: responsive.spacing.s,
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
      gap: responsive.spacing.m,
      marginTop: responsive.spacing.l,
      marginBottom: responsive.spacing.m,
      width: '100%',
    },
    closeButton: {
      marginTop: responsive.spacing.l,
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
      paddingHorizontal: responsive.spacing.m,
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
  showImage = false,
  children,
}: GenericDetailModalProps<TItem>) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = useMemo(
    () => getStyles(theme, responsive),
    [theme, responsive],
  );
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (item && imageField && item.hasOwnProperty(imageField)) {
      const imageFieldValue = item[imageField];
      if (
        typeof imageFieldValue === 'object' &&
        imageFieldValue !== null &&
        'path' in imageFieldValue &&
        typeof imageFieldValue.path === 'string'
      ) {
        getImageUrl(imageFieldValue.path).then((url) => {
          setImageUrl(url ?? undefined);
        });
      } else if (typeof imageFieldValue === 'string') {
        setImageUrl(imageFieldValue);
      }
    } else {
      setImageUrl(undefined);
    }
  }, [item, imageField]);

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
          {(imageUrl || showImage) && (
            <AutoImage
              source={imageUrl}
              placeholderIcon="image-outline"
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
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={[styles.modalSurface, modalStyle]}
      dismissable={!isDeleting}
      scrollable={true}
    >
      {renderContent()}
    </ResponsiveModal>
  );
};

export default GenericDetailModal;
