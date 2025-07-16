import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Divider,
  Chip,
  Button,
  Avatar,
  Surface,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface HistoryItem {
  id: string | number;
  orderId: string;
  orderItemId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'BATCH';
  changedBy: string;
  changedAt: string;
  diff?: Record<string, any> | null;
  snapshot?: Record<string, any>;
  productId?: string;
  preparationStatus?: string;
  changedByUser?: {
    id?: string;
    firstName: string;
    lastName: string;
  };
  user?: {
    firstName: string;
    lastName: string;
  };
  itemDescription?: string;
  formattedChanges?: Record<string, any>;
  batchOperations?: any[];
  type: 'order' | 'item';
}

interface OrderHistoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
}

// Helper para obtener el icono de la operación
const getOperationIcon = (
  operation: string,
  type: 'order' | 'item' = 'item',
) => {
  if (type === 'order') {
    return 'receipt';
  }
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

// Helper para obtener el label de la operación
const getOperationLabel = (
  operation: string,
  type: 'order' | 'item' = 'item',
) => {
  if (type === 'order') {
    const orderOperationMap: Record<string, string> = {
      INSERT: 'Orden creada',
      UPDATE: 'Orden modificada',
      DELETE: 'Orden eliminada',
    };
    return orderOperationMap[operation] || operation;
  }

  const operationMap: Record<string, string> = {
    INSERT: 'Item agregado',
    UPDATE: 'Item modificado',
    DELETE: 'Item eliminado',
    BATCH: 'Cambios múltiples',
  };
  return operationMap[operation] || operation;
};

// Helper para obtener el color del status
const getStatusColor = (status: string, theme: any) => {
  switch (status) {
    case 'PENDING':
      return theme.colors.error;
    case 'IN_PROGRESS':
    case 'IN_PREPARATION':
      return theme.colors.warning;
    case 'READY':
    case 'DELIVERED':
    case 'COMPLETED':
      return theme.colors.success;
    case 'CANCELLED':
      return theme.colors.onSurfaceVariant;
    default:
      return theme.colors.onSurface;
  }
};

// Helper para formatear nombres de campos
const formatFieldName = (field: string): string => {
  const fieldMap: Record<string, string> = {
    orderStatus: 'Estado de la orden',
    orderType: 'Tipo de orden',
    tableId: 'Mesa',
    table: 'Mesa',
    notes: 'Notas',
    deliveryInfo: 'Información de entrega',
    scheduledAt: 'Programado para',
    customerId: 'Cliente',
    isFromWhatsApp: 'Orden de WhatsApp',
    // Campos dentro de deliveryInfo
    recipientName: 'Destinatario',
    recipientPhone: 'Teléfono',
    fullAddress: 'Dirección completa',
    deliveryInstructions: 'Instrucciones de entrega',
    street: 'Calle',
    number: 'Número',
    neighborhood: 'Colonia',
    city: 'Ciudad',
    state: 'Estado',
    zipCode: 'Código postal',
  };
  return fieldMap[field] || field;
};

// Helper para formatear valores
const formatValue = (field: string, value: any): string => {
  if (value === null || value === undefined) return 'Sin valor';

  if (field === 'orderStatus' || field === 'preparationStatus') {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      IN_PREPARATION: 'En Preparación',
      READY: 'Lista',
      DELIVERED: 'Entregada',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
    };
    return statusMap[value] || value;
  }

  if (field === 'orderType') {
    const typeMap: Record<string, string> = {
      DINE_IN: 'Para Comer Aquí',
      TAKE_AWAY: 'Para Llevar',
      DELIVERY: 'Domicilio',
    };
    return typeMap[value] || value;
  }

  if (field === 'table' || field === 'tableId') {
    if (typeof value === 'object' && value !== null) {
      return value.name || 'Sin mesa';
    }
    return value || 'Sin mesa';
  }

  // Para datos de entrega
  if (field === 'recipientName') {
    return value || 'Sin nombre';
  }

  if (field === 'recipientPhone') {
    return value || 'Sin teléfono';
  }

  if (field === 'fullAddress') {
    return value || 'Sin dirección';
  }

  if (field === 'isFromWhatsApp') {
    return value ? 'Sí' : 'No';
  }

  if (field === 'customerId') {
    return value || 'Sin cliente registrado';
  }

  if (field === 'scheduledAt') {
    return value
      ? format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: es })
      : 'No programado';
  }

  return String(value);
};

// Componente para cada item del historial
const HistoryItemComponent: React.FC<{
  item: HistoryItem;
  theme: ReturnType<typeof useAppTheme>;
}> = ({ item, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderChangeDetail = (change: any, fieldName?: string) => {
    if (
      change &&
      typeof change === 'object' &&
      change.anterior !== undefined &&
      change.nuevo !== undefined
    ) {
      // Para descripción del item, mostrar en formato vertical si es muy largo
      if (
        (fieldName === 'Descripción del Item' || fieldName === 'Descripción') &&
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
    } else if (Array.isArray(change) && change.length === 2) {
      // Para el formato de array [antes, después] - usado en cambios de orden
      const oldVal = formatValue(fieldName || '', change[0]);
      const newVal = formatValue(fieldName || '', change[1]);

      // Para campos largos o especiales, usar formato vertical
      if (
        fieldName &&
        ['notes', 'deliveryInfo', 'customerName', 'deliveryAddress'].includes(
          fieldName,
        )
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
                {oldVal}
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
                {newVal}
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
              paddingHorizontal: 8,
              paddingVertical: 4,
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
              {oldVal}
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
              paddingHorizontal: 8,
              paddingVertical: 4,
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
              {newVal}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <Surface
      style={[
        styles.historyItem,
        { backgroundColor: theme.colors.surfaceVariant },
      ]}
      elevation={1}
    >
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
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
                icon={getOperationIcon(item.operation, item.type)}
                style={{
                  backgroundColor:
                    item.type === 'order'
                      ? theme.colors.primary
                      : theme.colors.secondary,
                  marginRight: 6,
                }}
              />
              <Text
                variant="bodySmall"
                style={{ fontWeight: '600', flex: 1 }}
                numberOfLines={1}
              >
                {item.changedByUser
                  ? `${item.changedByUser.firstName} ${item.changedByUser.lastName}`
                  : item.user
                    ? `${item.user.firstName} ${item.user.lastName}`
                    : 'Sistema'}
              </Text>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.colors.surfaceVariant,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
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
                gap: 4,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor:
                    (item.type === 'order'
                      ? theme.colors.primary
                      : theme.colors.secondary) + '15',
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 10,
                }}
              >
                <Icon
                  name={getOperationIcon(item.operation, item.type)}
                  size={10}
                  color={
                    item.type === 'order'
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={{
                    color:
                      item.type === 'order'
                        ? theme.colors.primary
                        : theme.colors.secondary,
                    fontSize: 9,
                    fontWeight: '600',
                  }}
                >
                  {getOperationLabel(item.operation, item.type)}
                </Text>
              </View>

              {item.preparationStatus && (
                <Chip
                  mode="flat"
                  textStyle={{ fontSize: 9 }}
                  style={{
                    backgroundColor:
                      getStatusColor(item.preparationStatus, theme) + '20',
                    transform: [{ scale: 0.8 }],
                    height: 20,
                  }}
                  compact
                >
                  {formatValue('preparationStatus', item.preparationStatus)}
                </Chip>
              )}

              <Text variant="labelSmall" style={{ opacity: 0.6, fontSize: 10 }}>
                {format(new Date(item.changedAt), 'dd/MM/yyyy HH:mm', {
                  locale: es,
                })}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <Divider style={{ marginBottom: 8 }} />

          {/* Contenido para órdenes */}
          {item.type === 'order' && (
            <View style={styles.changesContainer}>
              {item.operation === 'INSERT' && (
                <>
                  {/* Si hay diff consolidado para INSERT, usarlo */}
                  {item.diff && (item.diff.order || item.diff.items) ? (
                    <>
                      {item.diff.summary && (
                        <Text
                          variant="bodySmall"
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

                      {/* Información de la orden */}
                      {item.diff.order && (
                        <View
                          style={{
                            backgroundColor: theme.colors.surface,
                            padding: 8,
                            borderRadius: 6,
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.primary,
                              fontWeight: '600',
                              marginBottom: 6,
                            }}
                          >
                            Detalles de la orden:
                          </Text>

                          {item.diff.order.fields?.orderType && (
                            <Text
                              variant="bodySmall"
                              style={{ marginBottom: 4 }}
                            >
                              <Text style={{ fontWeight: '600' }}>Tipo:</Text>{' '}
                              {formatValue(
                                'orderType',
                                item.diff.order.fields.orderType[1],
                              )}
                            </Text>
                          )}
                          {item.diff.order.fields?.tableId && (
                            <Text
                              variant="bodySmall"
                              style={{ marginBottom: 4 }}
                            >
                              <Text style={{ fontWeight: '600' }}>Mesa:</Text>{' '}
                              {item.snapshot?.table?.name ||
                                `Mesa ${item.diff.order.fields.tableId[1]}`}
                            </Text>
                          )}
                          {item.diff.order.fields?.notes && (
                            <Text
                              variant="bodySmall"
                              style={{ marginBottom: 4 }}
                            >
                              <Text style={{ fontWeight: '600' }}>Notas:</Text>{' '}
                              {item.diff.order.fields.notes[1]}
                            </Text>
                          )}

                          {/* Información de entrega */}
                          {item.diff.order.deliveryInfo && (
                            <>
                              {item.diff.order.deliveryInfo.recipientName && (
                                <Text
                                  variant="bodySmall"
                                  style={{ marginBottom: 4 }}
                                >
                                  <Text style={{ fontWeight: '600' }}>
                                    Cliente:
                                  </Text>{' '}
                                  {
                                    item.diff.order.deliveryInfo
                                      .recipientName[1]
                                  }
                                </Text>
                              )}
                              {item.diff.order.deliveryInfo.recipientPhone && (
                                <Text
                                  variant="bodySmall"
                                  style={{ marginBottom: 4 }}
                                >
                                  <Text style={{ fontWeight: '600' }}>
                                    Teléfono:
                                  </Text>{' '}
                                  {
                                    item.diff.order.deliveryInfo
                                      .recipientPhone[1]
                                  }
                                </Text>
                              )}
                              {item.diff.order.deliveryInfo.fullAddress && (
                                <Text
                                  variant="bodySmall"
                                  style={{ marginBottom: 4 }}
                                >
                                  <Text style={{ fontWeight: '600' }}>
                                    Dirección:
                                  </Text>{' '}
                                  {item.diff.order.deliveryInfo.fullAddress[1]}
                                </Text>
                              )}
                            </>
                          )}
                        </View>
                      )}

                      {/* Productos agregados */}
                      {item.diff.items?.added &&
                        item.diff.items.added.length > 0 && (
                          <>
                            <Text
                              variant="labelSmall"
                              style={{
                                color: theme.colors.primary,
                                fontWeight: '600',
                                marginBottom: 8,
                                marginTop: 8,
                              }}
                            >
                              Productos incluidos en la orden:
                            </Text>
                            {item.diff.items.added.map(
                              (addedItem: any, idx: number) => (
                                <View
                                  key={`added-${idx}`}
                                  style={{
                                    marginBottom: 8,
                                    paddingLeft: 8,
                                    borderLeftWidth: 2,
                                    borderLeftColor:
                                      theme.colors.primary + '50',
                                    backgroundColor: theme.colors.surface,
                                    padding: 8,
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
                                        color: theme.colors.onSurfaceVariant,
                                      }}
                                    >
                                      Modificadores:{' '}
                                      {addedItem.modifiers.join(', ')}
                                    </Text>
                                  )}
                                  {addedItem.customizations?.length > 0 && (
                                    <Text
                                      variant="labelSmall"
                                      style={{
                                        marginTop: 2,
                                        color: theme.colors.onSurfaceVariant,
                                      }}
                                    >
                                      Personalizaciones:{' '}
                                      {addedItem.customizations.join(', ')}
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
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      marginTop: 2,
                                      fontWeight: '600',
                                      color: theme.colors.primary,
                                    }}
                                  >
                                    Precio: ${addedItem.price}
                                  </Text>
                                </View>
                              ),
                            )}
                          </>
                        )}
                    </>
                  ) : (
                    // Fallback al formato anterior si no hay diff
                    <>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: '600',
                          marginBottom: 8,
                        }}
                      >
                        Nueva orden creada
                      </Text>
                      {item.snapshot && (
                        <View
                          style={{
                            backgroundColor: theme.colors.surface,
                            padding: 8,
                            borderRadius: 6,
                          }}
                        >
                          {item.snapshot.orderType && (
                            <Text
                              variant="bodySmall"
                              style={{ marginBottom: 4 }}
                            >
                              <Text style={{ fontWeight: '600' }}>Tipo:</Text>{' '}
                              {formatValue(
                                'orderType',
                                item.snapshot.orderType,
                              )}
                            </Text>
                          )}
                          {item.snapshot.tableId && (
                            <Text
                              variant="bodySmall"
                              style={{ marginBottom: 4 }}
                            >
                              <Text style={{ fontWeight: '600' }}>Mesa:</Text>{' '}
                              {item.snapshot.table?.name ||
                                'Mesa ' + item.snapshot.tableId}
                            </Text>
                          )}
                          {item.snapshot.notes && (
                            <Text variant="bodySmall">
                              <Text style={{ fontWeight: '600' }}>Notas:</Text>{' '}
                              {item.snapshot.notes}
                            </Text>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {item.operation === 'UPDATE' &&
                item.diff &&
                (() => {
                  const relevantChanges = Object.entries(item.diff)
                    .filter(([field]) => {
                      // Solo mostrar campos que rastreamos en el backend
                      const allowedFields = [
                        'orderStatus',
                        'orderType',
                        'notes',
                        'tableId',
                        'customerId',
                        'scheduledAt',
                        'deliveryInfo',
                        'isFromWhatsApp',
                      ];
                      return allowedFields.includes(field);
                    })
                    .flatMap(([field, change]) => {
                      // Si es deliveryInfo y es un objeto, expandir sus propiedades
                      if (
                        field === 'deliveryInfo' &&
                        change &&
                        typeof change === 'object' &&
                        !Array.isArray(change)
                      ) {
                        return Object.entries(change).map(
                          ([subField, subChange]) => ({
                            field: subField,
                            change: subChange,
                          }),
                        );
                      }
                      return [{ field, change }];
                    });

                  if (relevantChanges.length === 0) {
                    return (
                      <Text
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        Actualización de productos de la orden
                      </Text>
                    );
                  }

                  return (
                    <>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: '600',
                          marginBottom: 8,
                        }}
                      >
                        Cambios en la orden:
                      </Text>
                      {relevantChanges.map(({ field, change }) => (
                        <View key={field} style={{ marginBottom: 8 }}>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              fontWeight: '600',
                              marginBottom: 4,
                              textTransform: 'capitalize',
                            }}
                          >
                            {formatFieldName(field)}:
                          </Text>
                          {renderChangeDetail(change, field)}
                        </View>
                      ))}
                    </>
                  );
                })()}

              {item.operation === 'DELETE' && (
                <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                  La orden fue eliminada
                </Text>
              )}
            </View>
          )}

          {/* Contenido consolidado nuevo formato */}
          {item.diff &&
            (item.diff.order || item.diff.items || item.diff.summary) && (
              <View style={styles.changesContainer}>
                {/* Resumen de cambios */}
                {item.diff.summary && (
                  <Text
                    variant="bodySmall"
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

                {/* Cambios en la orden */}
                {item.diff.order?.fields && (
                  <>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: '600',
                        marginBottom: 8,
                      }}
                    >
                      Cambios en la orden:
                    </Text>
                    {Object.entries(item.diff.order.fields).map(
                      ([field, change]) => (
                        <View key={field} style={{ marginBottom: 8 }}>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              fontWeight: '600',
                              marginBottom: 4,
                              textTransform: 'capitalize',
                            }}
                          >
                            {formatFieldName(field)}:
                          </Text>
                          {renderChangeDetail(change, field)}
                        </View>
                      ),
                    )}
                  </>
                )}

                {/* Cambios en información de entrega */}
                {item.diff.order?.deliveryInfo && (
                  <>
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: '600',
                        marginBottom: 8,
                      }}
                    >
                      Cambios en información de entrega:
                    </Text>
                    {Object.entries(item.diff.order.deliveryInfo).map(
                      ([field, change]) => (
                        <View key={field} style={{ marginBottom: 8 }}>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                              fontWeight: '600',
                              marginBottom: 4,
                              textTransform: 'capitalize',
                            }}
                          >
                            {formatFieldName(field)}:
                          </Text>
                          {renderChangeDetail(change, field)}
                        </View>
                      ),
                    )}
                  </>
                )}

                {/* Usar formattedChanges si está disponible para mostrar cambios simplificados */}
                {item.formattedChanges &&
                  item.formattedChanges['Cambios en productos'] && (
                    <>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: '600',
                          marginBottom: 8,
                        }}
                      >
                        Cambios en productos:
                      </Text>

                      {/* Productos modificados - diseño mejorado */}
                      {item.formattedChanges['Cambios en productos'][
                        'Productos modificados'
                      ] && (
                        <View style={{ marginTop: 8 }}>
                          {item.formattedChanges['Cambios en productos'][
                            'Productos modificados'
                          ].map((modItem: any, idx: number) => (
                            <View
                              key={`mod-${idx}`}
                              style={{
                                marginBottom: 12,
                                backgroundColor: theme.colors.surfaceVariant,
                                borderRadius: theme.roundness * 2,
                                overflow: 'hidden',
                              }}
                            >
                              {/* Header del cambio */}
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  backgroundColor: theme.colors.warning + '20',
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
                                    backgroundColor: theme.colors.surface,
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
                                      }}
                                    >
                                      Antes
                                    </Text>
                                    <Text
                                      variant="bodySmall"
                                      style={{
                                        color: theme.colors.onSurfaceVariant,
                                        textDecorationLine: 'line-through',
                                        opacity: 0.7,
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
                                      size={24}
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
                                      }}
                                    >
                                      Después
                                    </Text>
                                    <Text
                                      variant="bodySmall"
                                      style={{
                                        color: theme.colors.primary,
                                        fontWeight: '600',
                                      }}
                                    >
                                      {modItem.después}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Productos agregados - formato simplificado */}
                      {item.formattedChanges['Cambios en productos'][
                        'Productos agregados'
                      ] && (
                        <>
                          {item.formattedChanges['Cambios en productos'][
                            'Productos agregados'
                          ].map((product: string, idx: number) => (
                            <View
                              key={`added-${idx}`}
                              style={{
                                marginBottom: 8,
                                paddingLeft: 8,
                                borderLeftWidth: 2,
                                borderLeftColor: theme.colors.success + '50',
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Icon
                                  name="plus-circle"
                                  size={14}
                                  color={theme.colors.success}
                                  style={{ marginRight: 6, marginTop: 2 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.success,
                                      fontWeight: '600',
                                    }}
                                  >
                                    Producto agregado
                                  </Text>
                                  <Text
                                    variant="bodySmall"
                                    style={{ marginTop: 2 }}
                                  >
                                    {product}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </>
                      )}

                      {/* Productos eliminados - formato simplificado */}
                      {item.formattedChanges['Cambios en productos'][
                        'Productos eliminados'
                      ] && (
                        <>
                          {item.formattedChanges['Cambios en productos'][
                            'Productos eliminados'
                          ].map((product: string, idx: number) => (
                            <View
                              key={`removed-${idx}`}
                              style={{
                                marginBottom: 8,
                                paddingLeft: 8,
                                borderLeftWidth: 2,
                                borderLeftColor: theme.colors.error + '50',
                              }}
                            >
                              <View
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Icon
                                  name="delete"
                                  size={14}
                                  color={theme.colors.error}
                                  style={{ marginRight: 6, marginTop: 2 }}
                                />
                                <View style={{ flex: 1 }}>
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.error,
                                      fontWeight: '600',
                                    }}
                                  >
                                    Producto eliminado
                                  </Text>
                                  <Text
                                    variant="bodySmall"
                                    style={{ marginTop: 2 }}
                                  >
                                    {product}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          ))}
                        </>
                      )}
                    </>
                  )}

                {/* Cambios en items - formato JSON crudo (fallback si no hay formattedChanges) */}
                {item.diff.items &&
                  !item.formattedChanges?.['Cambios en productos'] && (
                    <>
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: '600',
                          marginBottom: 8,
                        }}
                      >
                        Cambios en productos:
                      </Text>

                      {/* Items agregados */}
                      {item.diff.items.added?.map(
                        (addedItem: any, idx: number) => (
                          <View
                            key={`added-${idx}`}
                            style={{
                              marginBottom: 8,
                              paddingLeft: 8,
                              borderLeftWidth: 2,
                              borderLeftColor: theme.colors.success + '50',
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Icon
                                name="plus-circle"
                                size={14}
                                color={theme.colors.success}
                                style={{ marginRight: 6, marginTop: 2 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.success,
                                    fontWeight: '600',
                                  }}
                                >
                                  Producto agregado
                                </Text>
                                <Text
                                  variant="bodySmall"
                                  style={{ marginTop: 2 }}
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
                                      color: theme.colors.onSurfaceVariant,
                                    }}
                                  >
                                    Modificadores:{' '}
                                    {addedItem.modifiers.join(', ')}
                                  </Text>
                                )}
                                {addedItem.price && (
                                  <Text
                                    variant="labelSmall"
                                    style={{ marginTop: 2, fontWeight: '600' }}
                                  >
                                    Precio: ${addedItem.price}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ),
                      )}

                      {/* Items modificados - Solo mostrar antes y después */}
                      {item.diff.items.modified?.map(
                        (modItem: any, idx: number) => (
                          <View
                            key={`mod-${idx}`}
                            style={{
                              marginBottom: 8,
                              paddingLeft: 8,
                              borderLeftWidth: 2,
                              borderLeftColor: theme.colors.warning + '50',
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Icon
                                name="pencil"
                                size={14}
                                color={theme.colors.warning}
                                style={{ marginRight: 6, marginTop: 2 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.warning,
                                    fontWeight: '600',
                                  }}
                                >
                                  Producto modificado
                                </Text>
                                <View
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    marginTop: 4,
                                  }}
                                >
                                  <View
                                    style={{
                                      backgroundColor:
                                        theme.colors.errorContainer,
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 4,
                                      marginRight: 6,
                                      marginTop: 4,
                                    }}
                                  >
                                    <Text
                                      variant="bodySmall"
                                      style={{
                                        color: theme.colors.onErrorContainer,
                                      }}
                                    >
                                      {modItem.before.productName}
                                      {modItem.before.variantName
                                        ? ` - ${modItem.before.variantName}`
                                        : ''}
                                    </Text>
                                  </View>
                                  <Icon
                                    name="arrow-right"
                                    size={16}
                                    color={theme.colors.onSurfaceVariant}
                                    style={{
                                      marginHorizontal: 4,
                                      marginTop: 4,
                                    }}
                                  />
                                  <View
                                    style={{
                                      backgroundColor:
                                        theme.colors.primaryContainer,
                                      paddingHorizontal: 8,
                                      paddingVertical: 4,
                                      borderRadius: 4,
                                      marginTop: 4,
                                    }}
                                  >
                                    <Text
                                      variant="bodySmall"
                                      style={{
                                        color: theme.colors.onPrimaryContainer,
                                      }}
                                    >
                                      {modItem.after.productName}
                                      {modItem.after.variantName
                                        ? ` - ${modItem.after.variantName}`
                                        : ''}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>
                          </View>
                        ),
                      )}

                      {/* Items eliminados */}
                      {item.diff.items.removed?.map(
                        (removedItem: any, idx: number) => (
                          <View
                            key={`removed-${idx}`}
                            style={{
                              marginBottom: 8,
                              paddingLeft: 8,
                              borderLeftWidth: 2,
                              borderLeftColor: theme.colors.error + '50',
                            }}
                          >
                            <View
                              style={{
                                flexDirection: 'row',
                                alignItems: 'flex-start',
                              }}
                            >
                              <Icon
                                name="delete"
                                size={14}
                                color={theme.colors.error}
                                style={{ marginRight: 6, marginTop: 2 }}
                              />
                              <View style={{ flex: 1 }}>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.error,
                                    fontWeight: '600',
                                  }}
                                >
                                  Producto eliminado
                                </Text>
                                <Text
                                  variant="bodySmall"
                                  style={{ marginTop: 2 }}
                                >
                                  {removedItem.productName}
                                  {removedItem.variantName
                                    ? ` - ${removedItem.variantName}`
                                    : ''}
                                </Text>
                                {removedItem.price && (
                                  <Text
                                    variant="labelSmall"
                                    style={{ marginTop: 2, fontWeight: '600' }}
                                  >
                                    Precio: ${removedItem.price}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </View>
                        ),
                      )}
                    </>
                  )}
              </View>
            )}

          {/* Contenido para items individuales (legacy) */}
          {item.type === 'item' && item.operation !== 'BATCH' && (
            <View style={styles.changesContainer}>
              {item.operation === 'INSERT' && (
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.primary,
                    fontWeight: '600',
                    marginBottom: 8,
                  }}
                >
                  Nuevo item agregado:
                </Text>
              )}
              {item.operation === 'UPDATE' && item.formattedChanges && (
                <>
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.primary,
                      fontWeight: '600',
                      marginBottom: 8,
                    }}
                  >
                    Item modificado:
                  </Text>
                  {Object.entries(item.formattedChanges)
                    .filter(([fieldName]) => {
                      // Solo mostrar campos relevantes (no precios)
                      const allowedFields = [
                        'Descripción del Item',
                        'Estado',
                        'Notas de preparación',
                        'Producto',
                        'Variante',
                        'Modificadores',
                      ];
                      return allowedFields.includes(fieldName);
                    })
                    .map(([fieldName, change]) => (
                      <View key={fieldName} style={{ marginBottom: 8 }}>
                        <Text
                          variant="labelSmall"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            fontWeight: '600',
                            marginBottom: 4,
                          }}
                        >
                          {fieldName}:
                        </Text>
                        {renderChangeDetail(change, fieldName)}
                      </View>
                    ))}
                </>
              )}
              {item.operation === 'DELETE' && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.error, marginBottom: 8 }}
                >
                  Item eliminado:
                </Text>
              )}
              {/* Mostrar la descripción del item para INSERT y DELETE */}
              {(item.operation === 'INSERT' || item.operation === 'DELETE') &&
                item.itemDescription && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: theme.colors.onSurface,
                      backgroundColor: theme.colors.surface,
                      padding: 8,
                      borderRadius: 6,
                    }}
                  >
                    {item.itemDescription}
                  </Text>
                )}
            </View>
          )}

          {/* Contenido para batch de items */}
          {item.operation === 'BATCH' && item.batchOperations && (
            <View style={styles.changesContainer}>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.primary,
                  fontWeight: '600',
                  marginBottom: 8,
                }}
              >
                Cambios realizados en una sola edición:
              </Text>
              {item.batchOperations.map((op: any, idx: number) => (
                <View
                  key={idx}
                  style={{
                    marginBottom:
                      idx < item.batchOperations!.length - 1 ? 12 : 0,
                    paddingLeft: 8,
                    borderLeftWidth: 2,
                    borderLeftColor: theme.colors.primary + '30',
                    marginLeft: 4,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginBottom: 4,
                    }}
                  >
                    <Icon
                      name={getOperationIcon(op.operation)}
                      size={14}
                      color={theme.colors.primary}
                      style={{ marginRight: 6, marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="labelSmall"
                        style={{
                          color: theme.colors.primary,
                          fontWeight: '500',
                          marginBottom: 4,
                        }}
                      >
                        {getOperationLabel(op.operation)}
                      </Text>

                      {/* Mostrar descripción del item */}
                      {(op.itemDescription || op.snapshot?.itemDescription) && (
                        <Text
                          variant="bodySmall"
                          style={{
                            color: theme.colors.onSurface,
                            backgroundColor: theme.colors.surface,
                            padding: 6,
                            borderRadius: 4,
                          }}
                        >
                          {op.itemDescription || op.snapshot?.itemDescription}
                        </Text>
                      )}

                      {/* Para UPDATE, mostrar el cambio */}
                      {op.operation === 'UPDATE' && op.formattedChanges && (
                        <View style={{ marginTop: 4 }}>
                          {Object.entries(op.formattedChanges)
                            .filter(([fieldName]) => {
                              // Solo mostrar campos relevantes (no precios)
                              const allowedFields = [
                                'Descripción del Item',
                                'Descripción',
                                'Estado',
                                'Notas de preparación',
                                'Producto',
                                'Variante',
                                'Modificadores',
                                'Estado de preparación',
                              ];
                              return allowedFields.includes(fieldName);
                            })
                            .map(([fieldName, change]) => (
                              <View key={fieldName} style={{ marginBottom: 4 }}>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                    fontWeight: '500',
                                    fontSize: 11,
                                  }}
                                >
                                  {fieldName}:
                                </Text>
                                {renderChangeDetail(change, fieldName)}
                              </View>
                            ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </Surface>
  );
};

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderNumber,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Query combinado para obtener ambos historiales
  const {
    data: historyData,
    isError,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ['combinedHistory', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('No order ID');

      // Obtener historial consolidado de la orden
      const orderHistoryResponse = await apiClient.get(
        API_PATHS.ORDERS_HISTORY.replace(':orderId', orderId),
        {
          page: 1,
          limit: 100,
        },
      );

      const orderHistory =
        orderHistoryResponse.ok && orderHistoryResponse.data?.data
          ? orderHistoryResponse.data.data.map((item: any) => ({
              ...item,
              type: 'order' as const,
            }))
          : [];

      // Ya no necesitamos consultar el historial de items por separado
      // Todo está consolidado en el historial de la orden

      // No es necesario agrupar ya que cada registro ya contiene cambios consolidados
      return orderHistory;
    },
    enabled: visible && !!orderId,
    staleTime: 30000,
  });

  // Refrescar cuando se abre el modal
  useEffect(() => {
    if (visible && orderId) {
      refetch();
    }
  }, [visible, orderId, refetch]);

  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      return <HistoryItemComponent item={item} theme={theme} />;
    },
    [theme],
  );

  const renderEmpty = () => (
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
  );

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
      dismissable={true}
      dismissableBackButton={false}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text
            variant="titleMedium"
            style={{
              color: theme.colors.onSurface,
              fontSize: 18,
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            Historial de Orden #{orderNumber || ''}
          </Text>
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 2,
            }}
          >
            {historyData?.length || 0} cambios registrados
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
          <Icon name="close" size={24} color={theme.colors.onErrorContainer} />
        </TouchableOpacity>
      </View>

      <Divider />

      <View style={{ flex: 1 }}>
        {isError ? (
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
            <Button
              onPress={() => refetch()}
              mode="text"
              style={{ marginTop: 16 }}
            >
              Reintentar
            </Button>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : (
          <FlatList
            data={historyData || []}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => {
  return StyleSheet.create({
    modalContainer: {
      backgroundColor: theme.colors.surface,
      margin: 20,
      marginVertical: Platform.OS === 'ios' ? 60 : 40,
      borderRadius: theme.roundness * 3,
      height: '80%',
      maxHeight: 600,
      width: '90%',
      maxWidth: 500,
      alignSelf: 'center',
      elevation: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.58,
      shadowRadius: 16.0,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.m,
      backgroundColor: theme.colors.elevation.level2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      minHeight: 64,
    },
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listContent: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.xl * 2, // Más espacio al final para evitar superposición
    },
    loadingContainer: {
      flex: 1,
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    historyItem: {
      padding: theme.spacing.s,
      marginBottom: theme.spacing.s,
      marginHorizontal: theme.spacing.xs,
      borderRadius: theme.roundness * 2,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    historyHeader: {
      // Cambio a estructura vertical para evitar encimamiento
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
    },
    userDetails: {
      marginLeft: theme.spacing.s,
      flex: 1,
      minWidth: 0,
    },
    expandedContent: {
      marginTop: theme.spacing.m,
      backgroundColor: theme.colors.background,
      marginHorizontal: -theme.spacing.s,
      padding: theme.spacing.m,
      borderBottomLeftRadius: theme.roundness,
      borderBottomRightRadius: theme.roundness,
    },
    changesContainer: {
      paddingTop: theme.spacing.xs,
    },
    changeDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    emptyContainer: {
      flex: 1,
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

export default OrderHistoryModal;
