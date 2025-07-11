import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  ScrollView,
} from 'react-native';
import { Text, Button, Chip, ActivityIndicator } from 'react-native-paper';
import AutoImage from '../common/AutoImage';
import { useAppTheme, AppTheme } from '../../styles/theme';
import { AdaptiveModal } from '../common/AdaptiveModal';
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
) => {
  return StyleSheet.create({
    modalSurface: {
      padding: responsive.isTablet
        ? responsive.spacing.xl
        : responsive.spacing.m,
      margin: responsive.spacing.m,
      borderRadius: theme.roundness * 2,
      elevation: 4,
      backgroundColor: theme.colors.elevation.level2,
      maxWidth: responsive.isTablet ? 600 : 400,
      alignSelf: 'center',
      width: '90%',
    },
    modalTitle: {
      marginBottom: responsive.isTablet
        ? responsive.spacing.l
        : responsive.spacing.m,
      textAlign: 'center',
      fontWeight: '700',
      fontSize: responsive.isTablet ? 28 : 22,
    },
    detailContent: {
      alignItems: 'center',
      marginBottom: responsive.spacing.m,
      width: '100%',
    },
    detailImage: {
      width: responsive.isLandscape
        ? responsive.getResponsiveDimension(150, 220)
        : responsive.getResponsiveDimension(180, 250),
      height: responsive.isLandscape
        ? responsive.getResponsiveDimension(150, 220)
        : responsive.getResponsiveDimension(180, 250),
      borderRadius: theme.roundness * 2,
      marginBottom: responsive.isTablet
        ? responsive.spacing.l
        : responsive.spacing.s,
      backgroundColor: theme.colors.surfaceDisabled,
      elevation: 2,
    },
    detailDescription: {
      marginBottom: responsive.spacing.m,
      textAlign: 'center',
      lineHeight: responsive.isTablet ? 26 : 20,
      fontSize: responsive.isTablet ? 16 : 14,
      paddingHorizontal: responsive.spacing.s,
      flexWrap: 'wrap',
      width: '100%',
    },
    statusChipContainer: {
      marginBottom: responsive.spacing.s,
      marginTop: responsive.spacing.s,
    },
    statusChip: {
      paddingHorizontal: responsive.spacing.m,
      height: responsive.isTablet ? 42 : 36,
    },
    fieldsContainer: {
      width: '100%',
      marginBottom: responsive.spacing.s,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness * 1.5,
      padding: responsive.isTablet
        ? responsive.spacing.l
        : responsive.spacing.s,
      paddingHorizontal: responsive.isTablet
        ? responsive.spacing.l
        : responsive.spacing.m,
    },
    fieldRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: responsive.spacing.s,
      paddingVertical: responsive.spacing.xs,
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
      marginRight: responsive.spacing.s,
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 16 : 14,
      flexBasis: '35%',
      minWidth: 100,
    },
    fieldValue: {
      flex: 1,
      textAlign: 'right',
      color: theme.colors.onSurface,
      fontSize: responsive.isTablet ? 16 : 14,
      flexWrap: 'wrap',
      maxWidth: '65%',
    },
    detailActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: responsive.spacing.s,
      marginBottom: responsive.spacing.s,
      width: '100%',
    },
    closeButton: {
      alignSelf: 'center',
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      minWidth: responsive.isTablet ? 150 : 100,
      paddingHorizontal: responsive.spacing.m,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
    },
    actionButton: {
      borderRadius: theme.roundness,
      paddingHorizontal: responsive.spacing.s,
      flex: 1,
      maxWidth: responsive.isTablet ? 180 : '48%',
      minHeight: responsive.isTablet ? 48 : 40,
      minWidth: 100,
    },
    buttonContainer: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
      paddingHorizontal: responsive.spacing.m,
      paddingTop: responsive.spacing.m,
      paddingBottom: responsive.spacing.l,
      borderBottomLeftRadius: theme.roundness * 2,
      borderBottomRightRadius: theme.roundness * 2,
      minHeight: 100,
      flexShrink: 0,
    },
    scrollContainer: {
      flex: 1,
      overflow: 'hidden',
    },
    footerContainer: {
      width: '100%',
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
                    (() => {
                      const rendered = render(value, item);
                      // Si el render devuelve un string o número, lo envolvemos en Text
                      if (typeof rendered === 'string' || typeof rendered === 'number') {
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
                    })()
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
      <View style={styles.footerContainer}>
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
                labelStyle={{ fontSize: responsive.isTablet ? 14 : 13 }}
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
                labelStyle={{ fontSize: responsive.isTablet ? 14 : 13 }}
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
          contentStyle={{ paddingHorizontal: responsive.spacing.s }}
        >
          {closeButtonLabel}
        </Button>
      </View>
    );
  };

  return (
    <AdaptiveModal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={modalStyle}
      dismissable={!isDeleting}
      dismissableBackButton={!isDeleting}
      scrollable={true}
      maxWidth={responsive.isTablet ? 800 : 500}
      minHeight={responsive.isTablet ? 300 : 250}
      maxHeight={responsive.isTablet ? '95%' : '92%'}
      footer={renderFooter()}
      stickyFooter={true}
    >
      {renderContent()}
    </AdaptiveModal>
  );
}

export default GenericDetailModal;
