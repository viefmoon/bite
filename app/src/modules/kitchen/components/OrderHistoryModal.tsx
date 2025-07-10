import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Surface,
  IconButton,
  Divider,
  ActivityIndicator,
  Chip,
  Avatar,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
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
  orderData?: any; // Datos de la orden pasados desde el componente padre
}

// Helper para detectar si es el nuevo formato consolidado
const isConsolidatedFormat = (item: any): boolean => {
  return item.diff && (item.diff.order || item.diff.items || item.diff.summary);
};

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

  const {
    data: history,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['orderHistory', orderId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/v1/orders/${orderId}/history?limit=50`,
      );
      return response.data?.data || [];
    },
    enabled: visible && !!orderId,
    staleTime: 30000,
  });

  // Usar los datos pasados como prop o hacer la query si no están disponibles
  const { data: orderDataFromQuery } = useGetOrderByIdQuery(orderId, {
    enabled: visible && !!orderId && activeTab === 'details' && !orderDataFromProps,
  });
  
  // Transformar los datos de kitchen al formato esperado por OrderDetailContent
  const transformKitchenOrderToDetailFormat = (kitchenOrder: any) => {
    if (!kitchenOrder) return null;
    
    return {
      ...kitchenOrder,
      orderItems: kitchenOrder.items?.map((item: any) => ({
        id: item.id,
        product: {
          name: item.productName,
        },
        productVariant: item.variantName ? { name: item.variantName } : null,
        preparationNotes: item.preparationNotes,
        preparationStatus: item.preparationStatus,
        preparedAt: item.preparedAt,
        createdAt: item.createdAt || kitchenOrder.createdAt, // Usar createdAt del item o de la orden como fallback
        preparedBy: item.preparedByUser || (item.preparedBy ? {
          firstName: item.preparedBy.split(' ')[0] || item.preparedBy,
          lastName: item.preparedBy.split(' ').slice(1).join(' ') || '',
        } : null),
        preparedById: item.preparedBy ? 'kitchen-user' : null,
        modifiers: item.modifiers?.map((mod: string) => ({ name: mod })) || [],
        pizzaCustomizations: item.pizzaCustomizations || [],
      })) || [],
      total: 0, // Kitchen no tiene información de precios
    };
  };
  
  // Usar los datos de props si están disponibles, sino usar los de la query
  const orderData = orderDataFromProps 
    ? transformKitchenOrderToDetailFormat(orderDataFromProps)
    : orderDataFromQuery;

  const styles = createStyles(theme, responsive);

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

  const renderChangeDetail = (change: any, fieldName?: string) => {
    if (
      change &&
      typeof change === 'object' &&
      change.anterior !== undefined &&
      change.nuevo !== undefined
    ) {
      // Para descripción del item, mostrar en formato vertical si es muy largo
      if (
        fieldName === 'Descripción del Item' &&
        (String(change.anterior).length > 30 ||
          String(change.nuevo).length > 30)
      ) {
        return (
          <View style={{ marginTop: 4 }}>
            <View
              style={{
                backgroundColor: theme.colors.errorContainer,
                padding: 8,
                borderRadius: 6,
                marginBottom: 8,
              }}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onErrorContainer,
                  fontWeight: '600',
                  marginBottom: 4,
                }}
              >
                Antes:
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onErrorContainer }}
              >
                {String(change.anterior)}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: theme.colors.primaryContainer,
                padding: 8,
                borderRadius: 6,
              }}
            >
              <Text
                variant="labelSmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: '600',
                  marginBottom: 4,
                }}
              >
                Después:
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {String(change.nuevo)}
              </Text>
            </View>
          </View>
        );
      }

      // Formato horizontal para cambios cortos
      return (
        <View style={styles.changeDetail}>
          <View
            style={{
              backgroundColor: theme.colors.errorContainer,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              marginRight: 6,
            }}
          >
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onErrorContainer,
                fontWeight: '500',
              }}
            >
              {String(change.anterior)}
            </Text>
          </View>
          <Icon
            name="arrow-right"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={{ marginHorizontal: 4 }}
          />
          <View
            style={{
              backgroundColor: theme.colors.primaryContainer,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
            }}
          >
            <Text
              variant="labelSmall"
              style={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: '500',
              }}
            >
              {String(change.nuevo)}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSurface,
                fontSize: responsive.isTablet ? 18 : 16,
                fontWeight: '600',
              }}
              numberOfLines={1}
            >
              Orden #{orderNumber}
            </Text>
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 2,
              }}
            >
              {activeTab === 'history'
                ? `${history?.length || 0} cambios registrados`
                : 'Detalles de la orden'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.colors.errorContainer,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
            activeOpacity={0.8}
          >
            <Icon
              name="close"
              size={24}
              color={theme.colors.onErrorContainer}
            />
          </TouchableOpacity>
        </View>

        <Divider />

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}
            activeOpacity={0.7}
          >
            <Icon
              name="file-document-outline"
              size={20}
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
              size={20}
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

        <View style={{ flex: 1 }}>
          {activeTab === 'details' ? (
            // Vista de detalles
            <OrderDetailContent
              orderId={orderId}
              orderNumber={parseInt(orderNumber)}
              orderData={orderData}
            />
          ) : (
            // Vista de historial
            <>
              {error ? (
                <View style={styles.emptyContainer}>
                  <Icon
                    name="alert-circle"
                    size={48}
                    color={theme.colors.error}
                    style={{ opacity: 0.7 }}
                  />
                  <Text
                    variant="bodyLarge"
                    style={{
                      color: theme.colors.error,
                      marginTop: theme.spacing.m,
                      textAlign: 'center',
                    }}
                  >
                    Error al cargar el historial
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: theme.spacing.s,
                      textAlign: 'center',
                    }}
                  >
                    Por favor, intenta de nuevo más tarde
                  </Text>
                </View>
              ) : isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={theme.colors.primary}
                  />
                </View>
              ) : (
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {history && history.length > 0 ? (
                    history.map((item, index) => {
                      const isExpanded = expandedItems.has(item.id);
                      return (
                        <Surface
                          key={item.id}
                          style={[
                            styles.historyItem,
                            { backgroundColor: theme.colors.surfaceVariant },
                          ]}
                          elevation={1}
                        >
                          <TouchableOpacity
                            onPress={() => toggleExpanded(item.id)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.historyHeader}>
                              <View style={{ flex: 1, marginRight: 12 }}>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 4,
                                  }}
                                >
                                  <Avatar.Icon
                                    size={24}
                                    icon="account"
                                    style={{
                                      backgroundColor: theme.colors.primary,
                                      marginRight: 6,
                                    }}
                                  />
                                  <Text
                                    variant="bodySmall"
                                    style={{
                                      fontWeight: '600',
                                      flex: 1,
                                      fontSize: responsive.isTablet ? 13 : 12,
                                    }}
                                    numberOfLines={1}
                                  >
                                    {item.changedByUser
                                      ? `${item.changedByUser.firstName} ${item.changedByUser.lastName}`
                                      : 'Sistema'}
                                  </Text>
                                  <View
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 16,
                                      backgroundColor:
                                        theme.colors.surfaceVariant,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Icon
                                      name={
                                        isExpanded
                                          ? 'chevron-up'
                                          : 'chevron-down'
                                      }
                                      size={20}
                                      color={theme.colors.onSurfaceVariant}
                                    />
                                  </View>
                                </View>

                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                  }}
                                >
                                  <View
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      backgroundColor:
                                        theme.colors.primary + '15',
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 12,
                                    }}
                                  >
                                    <Icon
                                      name={getOperationIcon(item.operation)}
                                      size={12}
                                      color={theme.colors.primary}
                                      style={{ marginRight: 4 }}
                                    />
                                    <Text
                                      variant="labelSmall"
                                      style={{
                                        color: theme.colors.primary,
                                        fontSize: 10,
                                        fontWeight: '600',
                                      }}
                                    >
                                      {getOperationLabel(item.operation)}
                                    </Text>
                                  </View>

                                  {item.preparationStatus && (
                                    <Chip
                                      mode="flat"
                                      textStyle={{
                                        fontSize: responsive.isTablet ? 11 : 9,
                                      }}
                                      style={{
                                        backgroundColor:
                                          getStatusColor(
                                            item.preparationStatus,
                                          ) + '20',
                                        transform: [
                                          {
                                            scale: responsive.isTablet
                                              ? 1
                                              : 0.9,
                                          },
                                        ],
                                      }}
                                      compact
                                    >
                                      {getStatusLabel(item.preparationStatus)}
                                    </Chip>
                                  )}

                                  <Text
                                    variant={
                                      responsive.isTablet
                                        ? 'bodySmall'
                                        : 'labelSmall'
                                    }
                                    style={{ opacity: 0.7 }}
                                  >
                                    {format(
                                      new Date(item.changedAt),
                                      'dd/MM/yyyy HH:mm',
                                      { locale: es },
                                    )}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>

                          {/* Nuevo formato consolidado */}
                          {isExpanded && isConsolidatedFormat(item) && (
                            <View style={styles.changesContainer}>
                              {/* Resumen de cambios */}
                              {item.diff.summary && (
                                <Text
                                  variant={
                                    responsive.isTablet
                                      ? 'bodySmall'
                                      : 'labelSmall'
                                  }
                                  style={{
                                    color: theme.colors.primary,
                                    fontWeight: '600',
                                    marginBottom: 8,
                                    fontStyle: 'italic',
                                  }}
                                >
                                  {item.diff.summary}
                                </Text>
                              )}

                              {/* Para INSERT de orden completa */}
                              {item.operation === 'INSERT' &&
                                item.diff.items?.added && (
                                  <>
                                    <Text
                                      variant={
                                        responsive.isTablet
                                          ? 'bodySmall'
                                          : 'labelSmall'
                                      }
                                      style={{
                                        color: theme.colors.primary,
                                        fontWeight: '600',
                                        marginBottom: 8,
                                      }}
                                    >
                                      Productos incluidos en la orden:
                                    </Text>
                                    {item.diff.items.added.map(
                                      (addedItem: any, idx: number) => (
                                        <View
                                          key={`added-${idx}`}
                                          style={{
                                            marginBottom: 6,
                                            paddingLeft: 8,
                                            borderLeftWidth: 2,
                                            borderLeftColor:
                                              theme.colors.primary + '50',
                                            backgroundColor:
                                              theme.colors.surface,
                                            padding: 6,
                                            marginLeft: 4,
                                            borderRadius: 4,
                                          }}
                                        >
                                          <Text
                                            variant="bodySmall"
                                            style={{ fontWeight: '600' }}
                                          >
                                            {addedItem.productName}
                                            {addedItem.variantName
                                              ? ` - ${addedItem.variantName}`
                                              : ''}
                                          </Text>
                                          {addedItem.modifiers?.length > 0 && (
                                            <Text
                                              variant="labelSmall"
                                              style={{
                                                marginTop: 2,
                                                color:
                                                  theme.colors.onSurfaceVariant,
                                              }}
                                            >
                                              {addedItem.modifiers.join(', ')}
                                            </Text>
                                          )}
                                          {addedItem.notes && (
                                            <Text
                                              variant="labelSmall"
                                              style={{
                                                marginTop: 2,
                                                fontStyle: 'italic',
                                              }}
                                            >
                                              Notas: {addedItem.notes}
                                            </Text>
                                          )}
                                        </View>
                                      ),
                                    )}
                                  </>
                                )}

                              {/* Cambios en productos - Diseño mejorado */}
                              {item.operation === 'UPDATE' &&
                                item.formattedChanges &&
                                item.formattedChanges[
                                  'Cambios en productos'
                                ] && (
                                  <View style={{ marginTop: 8 }}>
                                    {/* Productos modificados */}
                                    {item.formattedChanges[
                                      'Cambios en productos'
                                    ]['Productos modificados']?.map(
                                      (modItem: any, idx: number) => (
                                        <View
                                          key={`mod-${idx}`}
                                          style={{
                                            marginBottom: 12,
                                            backgroundColor:
                                              theme.colors.surfaceVariant,
                                            borderRadius: theme.roundness * 2,
                                            overflow: 'hidden',
                                          }}
                                        >
                                          {/* Header del cambio */}
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              backgroundColor:
                                                theme.colors.warning + '20',
                                              paddingHorizontal: 12,
                                              paddingVertical: 8,
                                              borderBottomWidth: 1,
                                              borderBottomColor:
                                                theme.colors.warning + '30',
                                            }}
                                          >
                                            <Icon
                                              name="pencil"
                                              size={16}
                                              color={theme.colors.warning}
                                              style={{ marginRight: 8 }}
                                            />
                                            <Text
                                              variant="labelMedium"
                                              style={{
                                                color: theme.colors.warning,
                                                fontWeight: '600',
                                                flex: 1,
                                              }}
                                            >
                                              Producto modificado
                                            </Text>
                                          </View>

                                          {/* Contenido del cambio */}
                                          <View style={{ padding: 12 }}>
                                            <View
                                              style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                backgroundColor:
                                                  theme.colors.surface,
                                                borderRadius: theme.roundness,
                                                padding: 10,
                                              }}
                                            >
                                              {/* Antes */}
                                              <View
                                                style={{
                                                  flex: 1,
                                                  paddingRight: 8,
                                                }}
                                              >
                                                <Text
                                                  variant="labelSmall"
                                                  style={{
                                                    color: theme.colors.error,
                                                    marginBottom: 4,
                                                    opacity: 0.8,
                                                    fontSize:
                                                      responsive.isTablet
                                                        ? 11
                                                        : 10,
                                                  }}
                                                >
                                                  Antes
                                                </Text>
                                                <Text
                                                  variant="bodySmall"
                                                  style={{
                                                    color:
                                                      theme.colors
                                                        .onSurfaceVariant,
                                                    textDecorationLine:
                                                      'line-through',
                                                    opacity: 0.7,
                                                    fontSize:
                                                      responsive.isTablet
                                                        ? 13
                                                        : 12,
                                                  }}
                                                >
                                                  {modItem.antes}
                                                </Text>
                                              </View>

                                              {/* Flecha */}
                                              <View
                                                style={{
                                                  paddingHorizontal: 8,
                                                }}
                                              >
                                                <Icon
                                                  name="arrow-right-thick"
                                                  size={
                                                    responsive.isTablet
                                                      ? 24
                                                      : 20
                                                  }
                                                  color={theme.colors.primary}
                                                />
                                              </View>

                                              {/* Después */}
                                              <View
                                                style={{
                                                  flex: 1,
                                                  paddingLeft: 8,
                                                }}
                                              >
                                                <Text
                                                  variant="labelSmall"
                                                  style={{
                                                    color: theme.colors.primary,
                                                    marginBottom: 4,
                                                    fontSize:
                                                      responsive.isTablet
                                                        ? 11
                                                        : 10,
                                                  }}
                                                >
                                                  Después
                                                </Text>
                                                <Text
                                                  variant="bodySmall"
                                                  style={{
                                                    color: theme.colors.primary,
                                                    fontWeight: '600',
                                                    fontSize:
                                                      responsive.isTablet
                                                        ? 13
                                                        : 12,
                                                  }}
                                                >
                                                  {modItem.después}
                                                </Text>
                                              </View>
                                            </View>
                                          </View>
                                        </View>
                                      ),
                                    )}

                                    {/* Productos agregados */}
                                    {item.formattedChanges[
                                      'Cambios en productos'
                                    ]['Productos agregados']?.map(
                                      (product: string, idx: number) => (
                                        <View
                                          key={`added-${idx}`}
                                          style={{ marginBottom: 8 }}
                                        >
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              marginBottom: 4,
                                            }}
                                          >
                                            <Icon
                                              name="plus-circle"
                                              size={14}
                                              color={theme.colors.success}
                                              style={{ marginRight: 4 }}
                                            />
                                            <Text
                                              variant="labelSmall"
                                              style={{
                                                color: theme.colors.success,
                                                fontWeight: '600',
                                              }}
                                            >
                                              Producto agregado
                                            </Text>
                                          </View>
                                          <Text
                                            variant="bodySmall"
                                            style={{ marginLeft: 18 }}
                                          >
                                            {product}
                                          </Text>
                                        </View>
                                      ),
                                    )}

                                    {/* Productos eliminados */}
                                    {item.formattedChanges[
                                      'Cambios en productos'
                                    ]['Productos eliminados']?.map(
                                      (product: string, idx: number) => (
                                        <View
                                          key={`removed-${idx}`}
                                          style={{ marginBottom: 8 }}
                                        >
                                          <View
                                            style={{
                                              flexDirection: 'row',
                                              alignItems: 'center',
                                              marginBottom: 4,
                                            }}
                                          >
                                            <Icon
                                              name="delete"
                                              size={14}
                                              color={theme.colors.error}
                                              style={{ marginRight: 4 }}
                                            />
                                            <Text
                                              variant="labelSmall"
                                              style={{
                                                color: theme.colors.error,
                                                fontWeight: '600',
                                              }}
                                            >
                                              Producto eliminado
                                            </Text>
                                          </View>
                                          <Text
                                            variant="bodySmall"
                                            style={{ marginLeft: 18 }}
                                          >
                                            {product}
                                          </Text>
                                        </View>
                                      ),
                                    )}
                                  </View>
                                )}
                            </View>
                          )}
                        </Surface>
                      );
                    })
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Icon
                        name="history"
                        size={48}
                        color={theme.colors.onSurfaceVariant}
                        style={{ opacity: 0.5 }}
                      />
                      <Text
                        variant="bodyLarge"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          marginTop: theme.spacing.m,
                        }}
                      >
                        No hay historial disponible
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: any, responsive: any) => {
  const { height, width } = Dimensions.get('window');
  const isLandscape = width > height;

  return StyleSheet.create({
    modalContainer: {
      margin: isLandscape ? theme.spacing.s : theme.spacing.m,
      marginVertical: isLandscape ? theme.spacing.xs : theme.spacing.m,
      padding: 0,
      borderRadius: theme.roundness * 2,
      height: isLandscape ? height * 0.9 : height * 0.85,
      width: isLandscape ? '70%' : '95%',
      maxWidth: isLandscape ? 700 : 600,
      alignSelf: 'center',
      backgroundColor: theme.colors.surface,
      elevation: 4,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: responsive.spacing.m,
      paddingVertical: isLandscape
        ? responsive.spacing.xs
        : responsive.spacing.s,
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.roundness * 2,
      borderTopRightRadius: theme.roundness * 2,
      minHeight: isLandscape ? 40 : 56,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: isLandscape ? responsive.spacing.s : responsive.spacing.m,
      paddingBottom: responsive.spacing.xl * 3, // Más espacio al final para evitar superposición
    },
    loadingContainer: {
      padding: responsive.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    historyItem: {
      padding: isLandscape ? responsive.spacing.s : responsive.spacing.m,
      marginBottom: isLandscape ? responsive.spacing.xs : responsive.spacing.s,
      borderRadius: theme.roundness,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    historyHeader: {
      // Cambio a column para evitar encimamiento
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0, // Permite que el texto se trunque correctamente
    },
    userDetails: {
      marginLeft: responsive.spacing.s,
      flex: 1,
      minWidth: 0, // Permite que el texto se trunque correctamente
    },
    changesContainer: {
      marginTop: isLandscape ? responsive.spacing.xs : theme.spacing.s,
      paddingTop: isLandscape ? responsive.spacing.xs : theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline + '20',
    },
    changeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: responsive.spacing.xs,
      paddingHorizontal: responsive.spacing.xs,
    },
    changeKey: {
      fontWeight: '600',
      marginRight: responsive.spacing.xs,
      color: theme.colors.onSurfaceVariant,
      minWidth: responsive.isTablet ? 140 : 100,
    },
    changeDetail: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    changeLabel: {
      color: theme.colors.onSurface,
      lineHeight: responsive.isTablet ? 18 : 16,
    },
    productInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: isLandscape ? responsive.spacing.xs : responsive.spacing.s,
      backgroundColor: theme.colors.surfaceVariant + '30',
      borderRadius: theme.roundness / 2,
      padding: responsive.spacing.xs,
    },
    emptyContainer: {
      padding: responsive.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.elevation.level1,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.roundness,
      gap: theme.spacing.xs,
    },
    activeTab: {
      backgroundColor: theme.colors.primaryContainer,
    },
    tabText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: responsive.isTablet ? 14 : 12,
      fontWeight: '500',
    },
    activeTabText: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });
};
