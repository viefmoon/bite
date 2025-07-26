import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  Text,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import AutoImage from '../common/AutoImage';
import { useAppTheme, AppTheme } from '../../styles/theme';
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

interface DeleteConfirmation {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  show: (id: string) => void;
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
  deleteConfirmation?: DeleteConfirmation;
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
) => {
  return StyleSheet.create({
    modalSurface: {
      backgroundColor: theme.colors.elevation.level2,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      shadowColor: theme.colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    modalTitle: {
      marginTop: responsive.spacing(theme.spacing.l),
      marginBottom: responsive.spacing(theme.spacing.m),
      textAlign: 'center',
      fontWeight: '700',
      fontSize: responsive.isTablet ? 22 : 20,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
    },
    detailContent: {
      alignItems: 'center',
      marginBottom: responsive.spacing(theme.spacing.m),
      width: '100%',
      paddingHorizontal: responsive.spacing(theme.spacing.m),
    },
    detailImage: {
      width: responsive.isTablet
        ? responsive.getResponsiveDimension(120, 150)
        : responsive.getResponsiveDimension(150, 180),
      height: responsive.isTablet
        ? responsive.getResponsiveDimension(120, 150)
        : responsive.getResponsiveDimension(150, 180),
      borderRadius: theme.roundness * 2,
      marginBottom: responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surfaceDisabled,
      elevation: 2,
    },
    detailDescription: {
      marginBottom: responsive.spacing(theme.spacing.m),
      textAlign: 'center',
      lineHeight: responsive.isTablet ? 20 : 18,
      fontSize: responsive.isTablet ? 14 : 13,
      paddingHorizontal: responsive.spacing(theme.spacing.xs),
      flexWrap: 'wrap',
      width: '100%',
    },
    statusChipContainer: {
      marginBottom: responsive.spacing(theme.spacing.s),
      marginTop: responsive.spacing(theme.spacing.s),
    },
    statusChip: {
      paddingHorizontal: responsive.spacing(theme.spacing.s),
      height: responsive.isTablet ? 36 : 32,
    },
    fieldsContainer: {
      width: '100%',
      marginBottom: responsive.spacing(theme.spacing.m),
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 1.5,
      padding: responsive.isTablet
        ? responsive.spacing(theme.spacing.s)
        : responsive.spacing(theme.spacing.m),
      marginHorizontal: responsive.spacing(theme.spacing.m),
      alignSelf: 'center',
      maxWidth: '90%',
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: responsive.isTablet
        ? responsive.spacing(theme.spacing.xs)
        : responsive.spacing(theme.spacing.s),
      paddingVertical: responsive.isTablet
        ? responsive.spacing(theme.spacing.xxs)
        : responsive.spacing(theme.spacing.xs),
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      flexWrap: 'wrap',
    },
    lastFieldRow: {
      marginBottom: 0,
      borderBottomWidth: 0,
    },
    fieldLabel: {
      fontWeight: '600',
      marginRight: responsive.spacing(theme.spacing.s),
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 14 : 13,
      flexBasis: '35%',
      minWidth: 100,
    },
    fieldValue: {
      flex: 1,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 14 : 13,
      flexWrap: 'wrap',
      maxWidth: '65%',
    },
    detailActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: responsive.spacing(theme.spacing.s),
      marginBottom: responsive.spacing(theme.spacing.m),
      width: '100%',
      paddingHorizontal: responsive.spacing(theme.spacing.m),
    },
    closeButton: {
      alignSelf: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      minWidth: responsive.isTablet ? 150 : 100,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      marginBottom: responsive.spacing(theme.spacing.l),
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 300,
      flex: 1,
    },
    actionButton: {
      borderRadius: theme.roundness,
      paddingHorizontal: responsive.spacing(theme.spacing.s),
      flex: 1,
      maxWidth: responsive.isTablet ? 180 : '48%',
      minHeight: responsive.isTablet ? 48 : 40,
      minWidth: 100,
    },
    buttonContainer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingHorizontal: responsive.spacing(theme.spacing.m),
      paddingTop: responsive.spacing(theme.spacing.m),
      paddingBottom: responsive.spacing(theme.spacing.l),
    },
    closeIconButton: {
      position: 'absolute',
      top: responsive.spacing(theme.spacing.xs),
      right: responsive.spacing(theme.spacing.xs),
      zIndex: 1,
    },
  });
};

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
  deleteConfirmation,
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
}: GenericDetailModalProps<TItem>) {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = useMemo(
    () => getStyles(theme, responsive),
    [theme, responsive],
  );
  const imageSource = useMemo(() => {
    if (item && imageField && item.hasOwnProperty(imageField)) {
      const imageFieldValue = item[imageField];
      if (
        typeof imageFieldValue === 'object' &&
        imageFieldValue !== null &&
        'path' in imageFieldValue &&
        typeof imageFieldValue.path === 'string'
      ) {
        return imageFieldValue.path;
      } else if (typeof imageFieldValue === 'string') {
        return imageFieldValue;
      }
    }
    return null;
  }, [item, imageField]);

  const handleEdit = () => {
    if (onEdit && item) {
      onEdit(item);
    }
  };

  const handleDelete = () => {
    if (item) {
      if (deleteConfirmation) {
        deleteConfirmation.show(item.id);
      } else if (onDelete) {
        onDelete(item.id);
      }
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
        <IconButton
          icon="close"
          size={24}
          style={styles.closeIconButton}
          onPress={onDismiss}
          mode="contained-tonal"
        />
        <Text variant="headlineSmall" style={[styles.modalTitle, titleStyle]}>
          {title}
        </Text>
        <View style={styles.detailContent}>
          {showImage && (
            <AutoImage
              source={imageSource}
              placeholderIcon="image-outline"
              style={[styles.detailImage, imageStyle]}
              contentFit="contain"
              transition={300}
            />
          )}
          {statusChip}
          {description && (
            <Text
              style={[styles.detailDescription, descriptionStyle]}
              numberOfLines={4}
              ellipsizeMode="tail"
            >
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
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {(() => {
                        const rendered = render(value, item);
                        // Si el render devuelve un string o número, lo envolvemos en Text
                        if (
                          typeof rendered === 'string' ||
                          typeof rendered === 'number'
                        ) {
                          return (
                            <Text
                              style={[styles.fieldValue, fieldValueStyle]}
                              numberOfLines={3}
                              ellipsizeMode="tail"
                            >
                              {rendered}
                            </Text>
                          );
                        }
                        // Si ya es un elemento React, lo devolvemos tal cual
                        return rendered;
                      })()}
                    </View>
                  ) : (
                    <Text
                      style={[styles.fieldValue, fieldValueStyle]}
                      numberOfLines={3}
                      ellipsizeMode="tail"
                    >
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
      </>
    );
  };

  const renderFooter = () => {
    if (!item) return null;

    return (
      <>
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
                contentStyle={{ flexDirection: 'row' }}
                labelStyle={{ fontSize: responsive.isTablet ? 13 : 12 }}
                compact={!responsive.isTablet}
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
                contentStyle={{ flexDirection: 'row' }}
                labelStyle={{ fontSize: responsive.isTablet ? 13 : 12 }}
                compact={!responsive.isTablet}
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
          labelStyle={{ fontSize: responsive.isTablet ? 14 : 13 }}
          contentStyle={{
            paddingHorizontal: responsive.spacing(theme.spacing.s),
          }}
        >
          {closeButtonLabel}
        </Button>
      </>
    );
  };

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={!isDeleting}
        dismissableBackButton={!isDeleting}
        scrollable={true}
        maxWidth={responsive.isTablet ? 480 : 400}
        maxHeight={'85%'}
        footer={renderFooter()}
        stickyFooter={true}
        contentContainerStyle={[styles.modalSurface, modalStyle]}
      >
        {renderContent()}
      </ResponsiveModal>

      {deleteConfirmation && (
        <ConfirmationModal
          visible={deleteConfirmation.visible}
          title={deleteConfirmation.title}
          message={deleteConfirmation.message}
          onConfirm={deleteConfirmation.onConfirm}
          onCancel={deleteConfirmation.onCancel}
          onDismiss={deleteConfirmation.onCancel}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmButtonColor={theme.colors.error}
        />
      )}
    </>
  );
}

export default GenericDetailModal;
