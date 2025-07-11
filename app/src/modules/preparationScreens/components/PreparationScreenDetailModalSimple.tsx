import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Chip,
  ActivityIndicator,
  IconButton,
  Divider,
} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { PreparationScreen } from '../schema/preparationScreen.schema';

interface PreparationScreenDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  item: PreparationScreen | null;
  onEdit?: (item: PreparationScreen) => void;
  onDelete?: (id: string) => void;
  onManageProducts?: (item: PreparationScreen) => void;
  isDeleting?: boolean;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 2,
      margin: theme.spacing.l,
      maxHeight: '90%',
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.m,
    },
    headerInfo: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    statusChip: {
      marginLeft: theme.spacing.s,
    },
    scrollContent: {
      maxHeight: 400,
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
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surface,
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
}) => {
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
    const isActive = item.isActive ?? true;
    const color = getColor();

    return (
      <>
        {/* Header compacto */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.iconContainer, { backgroundColor: `${color}20` }]}
            >
              <Icon name={getIcon()} size={24} color={color} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>{item.name}</Text>
              {item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Chip
              mode="flat"
              compact
              style={styles.statusChip}
              textStyle={{ fontSize: 12 }}
              selected={isActive}
            >
              {isActive ? 'Activa' : 'Inactiva'}
            </Chip>
            <IconButton
              icon="close"
              size={24}
              onPress={onDismiss}
              disabled={isDeleting}
              style={{ marginLeft: theme.spacing.xs }}
            />
          </View>
        </View>

        {/* Contenido scrollable */}
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>

        {/* Acciones */}
        <View style={styles.actionContainer}>
          <View style={styles.actionButtons}>
            {onEdit && (
              <Button
                icon="pencil"
                mode="contained"
                onPress={handleEdit}
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
                onPress={handleDelete}
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
      </>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        dismissable={!isDeleting}
        contentContainerStyle={styles.modalContent}
      >
        {renderContent()}
      </Modal>
    </Portal>
  );
};

export default PreparationScreenDetailModal;
