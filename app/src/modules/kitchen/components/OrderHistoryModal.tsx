import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Surface,
  Divider,
  ActivityIndicator,
  Chip,
  Avatar,
  IconButton,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useResponsive } from '@/app/hooks/useResponsive';
import { OrderDetailContent } from '@/modules/orders/components/OrderDetailModal';
import { useGetOrderByIdQuery } from '@/modules/orders/hooks/useOrdersQueries';

interface OrderHistoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string;
  orderNumber: string;
  orderData?: any;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderNumber,
  orderData: orderDataFromProps,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const [expandedItems, setExpandedItems] = useState<Set<string | number>>(
    new Set(),
  );
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

  // Query para el historial
  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orderHistory', orderId],
    queryFn: async () => {
      const response = await apiClient.get(
        `${API_PATHS.ORDERS_HISTORY.replace(':orderId', orderId)}?limit=50`,
      );
      return response.data?.data || [];
    },
    enabled: visible && !!orderId && activeTab === 'history',
    staleTime: 30000,
  });

  // Query para los detalles si no se pasaron como prop
  const { data: orderDataFromQuery } = useGetOrderByIdQuery(orderId, {
    enabled:
      visible && !!orderId && activeTab === 'details' && !orderDataFromProps,
  });

  // Transformar datos
  const transformKitchenOrderToDetailFormat = (kitchenOrder: any) => {
    if (!kitchenOrder) return null;
    return {
      ...kitchenOrder,
      orderItems:
        kitchenOrder.items?.map((item: any) => ({
          id: item.id,
          product: { name: item.productName },
          productVariant: item.variantName ? { name: item.variantName } : null,
          preparationNotes: item.preparationNotes,
          preparationStatus: item.preparationStatus,
          preparedAt: item.preparedAt,
          createdAt: item.createdAt || kitchenOrder.createdAt,
          preparedBy: item.preparedByUser || null,
          modifiers:
            item.modifiers?.map((mod: string) => ({ name: mod })) || [],
          pizzaCustomizations: item.pizzaCustomizations || [],
        })) || [],
      total: 0,
    };
  };

  const orderData = orderDataFromProps
    ? transformKitchenOrderToDetailFormat(orderDataFromProps)
    : orderDataFromQuery;

  const toggleExpanded = (itemId: string | number) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Helpers para el historial
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PREPARATION: 'En preparación',
      PREPARED: 'Preparado',
      CANCELLED: 'Cancelado',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return theme.colors.error;
      case 'IN_PREPARATION':
        return theme.colors.warning;
      case 'PREPARED':
        return theme.colors.success;
      case 'CANCELLED':
        return theme.colors.onSurfaceVariant;
      default:
        return theme.colors.onSurface;
    }
  };

  const getOperationLabel = (operation: string) => {
    const operationMap: Record<string, string> = {
      INSERT: 'Creado',
      UPDATE: 'Modificado',
      DELETE: 'Eliminado',
      BATCH: 'Cambios múltiples',
    };
    return operationMap[operation] || operation;
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'plus-circle';
      case 'UPDATE':
        return 'pencil';
      case 'DELETE':
        return 'delete';
      case 'BATCH':
        return 'folder-multiple';
      default:
        return 'information';
    }
  };

  const styles = createStyles(theme, responsive);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <Surface style={styles.surface} elevation={4}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              <Text style={styles.orderNumberText}>Orden #{orderNumber}</Text>
              <Text style={styles.headerDivider}> - </Text>
              <Text style={styles.headerSubtitle}>
                {activeTab === 'history'
                  ? `${history?.length || 0} cambios registrados`
                  : 'Detalles de la orden'}
              </Text>
            </Text>
            <IconButton
              icon="close-circle"
              size={responsive.isTablet ? 36 : 32}
              onPress={onDismiss}
              style={styles.closeButton}
              iconColor={theme.colors.error}
            />
          </View>

          <Divider />

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'details' && styles.activeTab]}
              onPress={() => setActiveTab('details')}
              activeOpacity={0.7}
            >
              <Icon
                name="file-document-outline"
                size={22}
                color={
                  activeTab === 'details'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'details' && styles.activeTabText,
                ]}
              >
                Detalles
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.activeTab]}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.7}
            >
              <Icon
                name="history"
                size={22}
                color={
                  activeTab === 'history'
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'history' && styles.activeTabText,
                ]}
              >
                Historial
              </Text>
            </TouchableOpacity>
          </View>

          <Divider />

          {/* Content */}
          <View style={styles.contentContainer}>
            {activeTab === 'details' ? (
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.detailsScrollContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <OrderDetailContent
                  orderId={orderId}
                  orderNumber={parseInt(orderNumber)}
                  orderData={orderData}
                />
              </ScrollView>
            ) : (
              <>
                {error ? (
                  <View style={styles.centerContainer}>
                    <Icon
                      name="alert-circle"
                      size={48}
                      color={theme.colors.error}
                    />
                    <Text variant="bodyLarge" style={styles.errorText}>
                      Error al cargar el historial
                    </Text>
                  </View>
                ) : isLoading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator
                      size="large"
                      color={theme.colors.primary}
                    />
                  </View>
                ) : history && history.length > 0 ? (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                  >
                    {history.map((item: any) => {
                      const isExpanded = expandedItems.has(item.id);
                      return (
                        <Surface
                          key={item.id}
                          style={styles.historyCard}
                          elevation={1}
                        >
                          <TouchableOpacity
                            onPress={() => toggleExpanded(item.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.historyHeader}>
                              <Avatar.Icon
                                size={responsive.isTablet ? 32 : 28}
                                icon="account"
                                style={styles.avatar}
                              />
                              <View style={styles.historyInfo}>
                                <View style={styles.userRow}>
                                  <Text style={styles.userName}>
                                    {item.changedByUser
                                      ? `${item.changedByUser.firstName} ${item.changedByUser.lastName}`
                                      : 'Sistema'}
                                  </Text>
                                  <Chip
                                    mode="flat"
                                    compact
                                    textStyle={styles.chipText}
                                    style={[
                                      styles.chip,
                                      {
                                        backgroundColor:
                                          theme.colors.primaryContainer,
                                      },
                                    ]}
                                  >
                                    <Icon
                                      name={getOperationIcon(item.operation)}
                                      size={9}
                                    />{' '}
                                    {getOperationLabel(item.operation)}
                                  </Chip>
                                </View>
                                <Text style={styles.dateText}>
                                  {format(
                                    new Date(item.changedAt),
                                    'dd/MM/yyyy HH:mm',
                                    { locale: es },
                                  )}
                                </Text>
                              </View>
                              <Icon
                                name={
                                  isExpanded ? 'chevron-up' : 'chevron-down'
                                }
                                size={24}
                                color={theme.colors.onSurfaceVariant}
                              />
                            </View>
                          </TouchableOpacity>

                          {/* Contenido expandido */}
                          {isExpanded && item.diff && (
                            <View style={styles.expandedContent}>
                              <Divider style={styles.divider} />

                              {item.diff.summary && (
                                <Text
                                  variant="bodyMedium"
                                  style={styles.summary}
                                >
                                  {item.diff.summary}
                                </Text>
                              )}

                              {/* Productos agregados */}
                              {item.operation === 'INSERT' &&
                                item.diff.items?.added && (
                                  <View style={styles.changeSection}>
                                    <Text
                                      variant="titleSmall"
                                      style={styles.sectionTitle}
                                    >
                                      Productos incluidos:
                                    </Text>
                                    {item.diff.items.added.map(
                                      (product: any, idx: number) => (
                                        <View
                                          key={idx}
                                          style={styles.productItem}
                                        >
                                          <Text
                                            variant="bodyMedium"
                                            style={styles.productName}
                                          >
                                            • {product.productName}
                                            {product.variantName &&
                                              ` - ${product.variantName}`}
                                          </Text>
                                          {product.modifiers?.length > 0 && (
                                            <Text
                                              variant="bodySmall"
                                              style={styles.modifiers}
                                            >
                                              {product.modifiers.join(', ')}
                                            </Text>
                                          )}
                                        </View>
                                      ),
                                    )}
                                  </View>
                                )}

                              {/* Cambios en productos */}
                              {item.formattedChanges?.[
                                'Cambios en productos'
                              ] && (
                                <View style={styles.changeSection}>
                                  {/* Productos modificados */}
                                  {item.formattedChanges[
                                    'Cambios en productos'
                                  ]['Productos modificados']?.map(
                                    (mod: any, idx: number) => (
                                      <Surface
                                        key={idx}
                                        style={styles.changeCard}
                                        elevation={1}
                                      >
                                        <View style={styles.changeHeader}>
                                          <Icon
                                            name="pencil"
                                            size={16}
                                            color={theme.colors.warning}
                                          />
                                          <Text
                                            variant="labelLarge"
                                            style={styles.changeTitle}
                                          >
                                            Producto modificado
                                          </Text>
                                        </View>
                                        <View style={styles.changeBody}>
                                          <View style={styles.beforeAfter}>
                                            <Text
                                              variant="bodySmall"
                                              style={styles.beforeText}
                                            >
                                              Antes: {mod.antes}
                                            </Text>
                                            <Text
                                              variant="bodySmall"
                                              style={styles.afterText}
                                            >
                                              Después: {mod.después}
                                            </Text>
                                          </View>
                                        </View>
                                      </Surface>
                                    ),
                                  )}
                                </View>
                              )}
                            </View>
                          )}
                        </Surface>
                      );
                    })}
                  </ScrollView>
                ) : (
                  <View style={styles.centerContainer}>
                    <Icon
                      name="history"
                      size={48}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text variant="bodyLarge" style={styles.emptyText}>
                      No hay historial disponible
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: any, responsive: any) => {
  const { height, width } = Dimensions.get('window');
  const isLandscape = width > height;
  const isTablet = responsive.isTablet;

  return StyleSheet.create({
    modalContainer: {
      margin: isLandscape ? 8 : 12,
      maxWidth: isTablet ? (isLandscape ? 800 : 600) : 500,
      width: isTablet ? '90%' : '95%',
      height: isLandscape ? height * 0.9 : height * 0.85,
      maxHeight: isLandscape ? height * 0.9 : height * 0.85,
      alignSelf: 'center',
    },
    surface: {
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: isTablet ? 12 : 10,
      paddingVertical: isLandscape ? 6 : isTablet ? 8 : 6,
      minHeight: isLandscape ? 48 : isTablet ? 56 : 52,
    },
    headerTitle: {
      flex: 1,
      color: theme.colors.onSurface,
      fontSize: isTablet ? 16 : 14,
      marginRight: 8,
    },
    orderNumberText: {
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    headerDivider: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '400',
    },
    headerSubtitle: {
      color: theme.colors.onSurfaceVariant,
      fontWeight: '400',
      fontStyle: 'italic',
    },
    detailsScrollContent: {
      padding: isTablet ? 12 : 8,
    },
    closeButton: {
      margin: -4,
      backgroundColor: theme.colors.errorContainer,
      borderRadius: 20,
    },
    tabs: {
      flexDirection: 'row',
      paddingHorizontal: isTablet ? 12 : 10,
      paddingVertical: isLandscape ? 2 : isTablet ? 4 : 3,
      backgroundColor: theme.colors.surfaceVariant,
      gap: isTablet ? 4 : 2,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isLandscape ? 6 : isTablet ? 8 : 7,
      paddingHorizontal: isTablet ? 12 : 10,
      borderRadius: theme.roundness,
      gap: isTablet ? 6 : 4,
    },
    activeTab: {
      backgroundColor: theme.colors.primaryContainer,
    },
    tabText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: isTablet ? 15 : 13,
      fontWeight: '500',
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    contentContainer: {
      flex: 1,
      overflow: 'hidden',
      minHeight: 0, // Importante para que flex funcione correctamente
    },
    scrollContent: {
      padding: isTablet ? 8 : 6,
      paddingBottom: isTablet ? 12 : 10,
    },
    centerContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: isTablet ? 20 : 16,
      minHeight: 150,
    },
    errorText: {
      color: theme.colors.error,
      marginTop: 16,
      textAlign: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      marginTop: 16,
    },
    historyCard: {
      marginBottom: 4,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surface,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: isTablet ? 8 : 6,
      gap: isTablet ? 6 : 4,
    },
    avatar: {
      backgroundColor: theme.colors.primaryContainer,
    },
    historyInfo: {
      flex: 1,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    userName: {
      fontWeight: '600',
      color: theme.colors.onSurface,
      fontSize: isTablet ? 13 : 12,
    },
    chip: {
      minHeight: isTablet ? 20 : 18,
      height: 'auto',
      paddingVertical: 1,
      paddingHorizontal: 5,
    },
    chipText: {
      fontSize: isTablet ? 10 : 9,
      color: theme.colors.primary,
      lineHeight: isTablet ? 12 : 11,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    dateText: {
      color: theme.colors.onSurfaceVariant,
      opacity: 0.7,
      fontSize: isTablet ? 10 : 9,
      marginTop: 2,
    },
    expandedContent: {
      paddingHorizontal: isTablet ? 8 : 6,
      paddingBottom: isTablet ? 8 : 6,
    },
    divider: {
      marginBottom: 8,
    },
    summary: {
      color: theme.colors.primary,
      fontStyle: 'italic',
      marginBottom: 6,
    },
    changeSection: {
      marginTop: 6,
    },
    sectionTitle: {
      color: theme.colors.primary,
      fontWeight: '600',
      marginBottom: 4,
    },
    productItem: {
      marginBottom: 4,
      paddingLeft: 6,
    },
    productName: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    modifiers: {
      color: theme.colors.onSurfaceVariant,
      paddingLeft: 12,
      marginTop: 1,
    },
    changeCard: {
      marginBottom: 4,
      borderRadius: theme.roundness,
      overflow: 'hidden',
    },
    changeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: 8,
      backgroundColor: theme.colors.warning + '20',
    },
    changeTitle: {
      color: theme.colors.warning,
      fontWeight: '600',
    },
    changeBody: {
      padding: 8,
    },
    beforeAfter: {
      gap: 4,
    },
    beforeText: {
      color: theme.colors.onSurfaceVariant,
      textDecorationLine: 'line-through',
    },
    afterText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
};
