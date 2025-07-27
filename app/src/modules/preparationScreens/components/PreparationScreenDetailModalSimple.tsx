import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Text,
  Button,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { PreparationScreen } from '../schema/preparationScreen.schema';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

interface PreparationScreenDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  item: PreparationScreen | null;
  onEdit?: (item: PreparationScreen) => void;
  onDelete?: (id: string) => void;
  onManageProducts?: (item: PreparationScreen) => void;
  isDeleting?: boolean;
  deleteConfirmation?: {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    show: (id: string) => void;
  };
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    descriptionContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.m,
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
      marginLeft: theme.spacing.m,
    },
    statusChip: {
      marginLeft: theme.spacing.s,
    },
    section: {
      padding: theme.spacing.m,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: theme.spacing.m,
      color: theme.colors.onSurface,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
    },
    infoIcon: {
      marginRight: theme.spacing.m,
    },
    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    userChip: {
      marginRight: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
    },
    userChipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: theme.spacing.s,
    },
    productCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      marginTop: theme.spacing.s,
    },
    productInfo: {
      flex: 1,
    },
    productCount: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
    },
    productLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: theme.spacing.l,
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 14,
      marginTop: theme.spacing.s,
    },
    actionContainer: {
      // ResponsiveModal maneja padding y background
    },
    actionButtons: {
      flexDirection: 'row',
      gap: theme.spacing.m,
    },
    actionButton: {
      flex: 1,
      borderRadius: theme.roundness,
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl * 2,
    },
    headerActionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusChipText: {
      fontSize: 12,
    },
  });

const PreparationScreenDetailModal: React.FC<
  PreparationScreenDetailModalProps
> = ({
  visible,
  onDismiss,
  item,
  onEdit,
  onDelete,
  onManageProducts,
  isDeleting = false,
  deleteConfirmation: _deleteConfirmation,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  // Get color based on screen name
  const getColor = () => {
    if (!item) return theme.colors.primary;
    const name = item.name.toLowerCase();
    if (name.includes('pizza')) return '#FF6B6B';
    if (name.includes('hamburguesa')) return '#4ECDC4';
    if (name.includes('bar')) return '#667EEA';
    return theme.colors.primary;
  };

  // Get icon based on screen name
  const getIcon = () => {
    if (!item) return 'monitor-dashboard';
    const name = item.name.toLowerCase();
    if (name.includes('pizza')) return 'pizza';
    if (name.includes('hamburguesa')) return 'hamburger';
    if (name.includes('bar')) return 'glass-cocktail';
    return 'monitor-dashboard';
  };

  const renderContent = () => {
    if (!item) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            animating={true}
            size="large"
            color={theme.colors.primary}
          />
        </View>
      );
    }

    const userCount = item.users?.length || 0;
    const productCount = item.products?.length || 0;
    const color = getColor();

    return (
      <>
        {/* Información adicional del header */}
        {item.description && (
          <View style={styles.descriptionContainer}>
            <View
              style={[styles.iconContainer, { backgroundColor: `${color}20` }]}
            >
              <Icon name={getIcon()} size={24} color={color} />
            </View>
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        )}

        {/* Sección de usuarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="account-group" size={16} /> Usuarios Asignados (
            {userCount})
          </Text>

          {userCount > 0 ? (
            <View style={styles.userChipsContainer}>
              {item.users?.map((user: any) => (
                <Chip
                  key={user.id}
                  style={styles.userChip}
                  icon="account"
                  compact
                  mode="outlined"
                >
                  {`${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.username}
                </Chip>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon
                name="account-off-outline"
                size={32}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>Sin usuarios asignados</Text>
            </View>
          )}
        </View>

        <Divider />

        {/* Sección de productos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="food" size={16} /> Productos Asociados
          </Text>

          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productCount}>{productCount}</Text>
              <Text style={styles.productLabel}>
                {productCount === 1 ? 'Producto' : 'Productos'}
              </Text>
            </View>

            {onManageProducts && (
              <Button
                mode="contained-tonal"
                onPress={() => onManageProducts(item)}
                icon="link-variant"
                compact
              >
                Gestionar
              </Button>
            )}
          </View>
        </View>
      </>
    );
  };

  const headerActions = item && (
    <View style={styles.headerActionsContainer}>
      <Chip
        mode="flat"
        compact
        style={styles.statusChip}
        textStyle={styles.statusChipText}
        selected={item.isActive}
      >
        {item.isActive ? 'Activa' : 'Inactiva'}
      </Chip>
    </View>
  );

  const footerActions = item && (
    <View style={styles.actionContainer}>
      <View style={styles.actionButtons}>
        {onEdit && (
          <Button
            icon="pencil"
            mode="contained"
            onPress={() => onEdit(item)}
            disabled={isDeleting}
            style={styles.actionButton}
            buttonColor={theme.colors.primary}
          >
            Editar
          </Button>
        )}
        {onDelete && (
          <Button
            icon="delete"
            mode="contained-tonal"
            onPress={() => onDelete(item.id)}
            loading={isDeleting}
            disabled={isDeleting}
            style={styles.actionButton}
            buttonColor={theme.colors.errorContainer}
            textColor={theme.colors.error}
          >
            Eliminar
          </Button>
        )}
      </View>
    </View>
  );

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title={item?.name}
      headerActions={headerActions}
      hideCloseButton={isDeleting}
      dismissable={!isDeleting}
      maxHeightTablet="90%"
      scrollable={true}
      footer={footerActions}
    >
      {renderContent()}
    </ResponsiveModal>
  );
};

export default PreparationScreenDetailModal;
