import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Divider,
  Chip,
  Button,
  Avatar,
  Surface,
  Appbar,
} from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/app/services/apiClient';
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

interface OrderHistoryViewProps {
  orderId: string | null;
  orderNumber?: number;
  onBack: () => void;
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

// Helper para obtener color del estado
const getStatusColor = (
  status: string,
  theme: ReturnType<typeof useAppTheme>,
) => {
  const statusColors: Record<string, string> = {
    PENDING: theme.colors.onSurfaceDisabled,
    IN_PROGRESS: theme.colors.warning || '#FFA500',
    READY: theme.colors.success || '#4CAF50',
    CANCELLED: theme.colors.error,
  };
  return statusColors[status] || theme.colors.onSurfaceDisabled;
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
    customerName: 'Nombre del cliente',
    customerPhone: 'Teléfono del cliente',
    recipientName: 'Nombre del destinatario',
    recipientPhone: 'Teléfono del destinatario',
    deliveryAddress: 'Dirección de entrega',
    fullAddress: 'Dirección',
    estimatedDeliveryTime: 'Tiempo estimado de entrega',
    preparationStatus: 'Estado de preparación',
    preparationNotes: 'Notas de preparación',
    customerId: 'Cliente',
    scheduledAt: 'Fecha programada',
    total: 'Total',
    subtotal: 'Subtotal',
    finalizedAt: 'Finalizado',
  };
  return fieldMap[field] || field;
};

// Helper para formatear valores
const formatValue = (field: string, value: any): string => {
  if (value === null || value === undefined) {
    return 'No especificado';
  }

  if (field === 'orderStatus') {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Progreso',
      COMPLETED: 'Completada',
      CANCELLED: 'Cancelada',
      DELIVERED: 'Entregada',
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

  if (field === 'preparationStatus') {
    const statusMap: Record<string, string> = {
      PENDING: 'Pendiente',
      IN_PROGRESS: 'En Preparación',
      READY: 'Listo',
      CANCELLED: 'Cancelado',
    };
    return statusMap[value] || value;
  }

  if (field === 'tableId' && typeof value === 'object' && value.name) {
    return value.name;
  }

  if (
    field === 'estimatedDeliveryTime' ||
    field === 'scheduledAt' ||
    field === 'finalizedAt'
  ) {
    try {
      return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: es });
    } catch {
      return value;
    }
  }

  if (field === 'total' || field === 'subtotal') {
    return `$${parseFloat(value).toFixed(2)}`;
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

// Componente para cada item del historial (copiado de OrderHistoryModal)
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
                                      marginTop: 4,
                                      color: theme.colors.primary,
                                      fontWeight: '600',
                                    }}
                                  >
                                    Precio: $
                                    {addedItem.finalPrice ||
                                      addedItem.basePrice}
                                  </Text>
                                </View>
                              ),
                            )}
                          </>
                        )}
                    </>
                  ) : item.formattedChanges ? (
                    // Si hay formattedChanges (formato nuevo)
                    Object.entries(item.formattedChanges).map(
                      ([section, changes]) => {
                        if (section === 'Resumen') {
                          return (
                            <Text
                              key={section}
                              variant="bodySmall"
                              style={{
                                color: theme.colors.primary,
                                fontWeight: '600',
                                marginBottom: 8,
                                fontStyle: 'italic',
                              }}
                            >
                              {changes as string}
                            </Text>
                          );
                        }
                        return (
                          <View key={section} style={{ marginBottom: 12 }}>
                            <Text
                              variant="labelSmall"
                              style={{
                                color: theme.colors.primary,
                                fontWeight: '600',
                                marginBottom: 6,
                              }}
                            >
                              {section}:
                            </Text>
                            {typeof changes === 'object' &&
                              Object.entries(changes).map(([field, change]) => (
                                <View
                                  key={field}
                                  style={{ marginBottom: 4, marginLeft: 8 }}
                                >
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                      marginBottom: 2,
                                    }}
                                  >
                                    {field}:
                                  </Text>
                                  {renderChangeDetail(change, field)}
                                </View>
                              ))}
                          </View>
                        );
                      },
                    )
                  ) : (
                    // Formato original (legacy)
                    <Text
                      variant="bodySmall"
                      style={{ fontWeight: '600', marginBottom: 8 }}
                    >
                      Nueva orden creada
                      {item.snapshot?.orderType &&
                        ` - ${formatValue('orderType', item.snapshot.orderType)}`}
                    </Text>
                  )}
                </>
              )}

              {item.operation === 'UPDATE' &&
                (() => {
                  // Para formato nuevo con formattedChanges
                  if (item.formattedChanges) {
                    return Object.entries(item.formattedChanges).map(
                      ([section, changes]) => {
                        if (section === 'Resumen') {
                          return (
                            <Text
                              key={section}
                              variant="bodySmall"
                              style={{
                                color: theme.colors.primary,
                                fontWeight: '600',
                                marginBottom: 8,
                                fontStyle: 'italic',
                              }}
                            >
                              {changes as string}
                            </Text>
                          );
                        }
                        return (
                          <View key={section} style={{ marginBottom: 12 }}>
                            <Text
                              variant="labelSmall"
                              style={{
                                color: theme.colors.primary,
                                fontWeight: '600',
                                marginBottom: 6,
                              }}
                            >
                              {section}:
                            </Text>
                            {typeof changes === 'object' &&
                              Object.entries(changes).map(([field, change]) => (
                                <View
                                  key={field}
                                  style={{ marginBottom: 4, marginLeft: 8 }}
                                >
                                  <Text
                                    variant="labelSmall"
                                    style={{
                                      color: theme.colors.onSurfaceVariant,
                                      marginBottom: 2,
                                    }}
                                  >
                                    {field}:
                                  </Text>
                                  {renderChangeDetail(change, field)}
                                </View>
                              ))}
                          </View>
                        );
                      },
                    );
                  }

                  // Para formato con diff
                  if (item.diff) {
                    return (
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
                        {item.diff.order?.fields &&
                          Object.entries(item.diff.order.fields).map(
                            ([field, values]) => (
                              <View key={field} style={{ marginBottom: 8 }}>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                    fontWeight: '600',
                                    marginBottom: 4,
                                  }}
                                >
                                  {formatFieldName(field)}:
                                </Text>
                                {renderChangeDetail(values, field)}
                              </View>
                            ),
                          )}
                      </>
                    );
                  }

                  // Formato legacy
                  const relevantChanges = Object.entries(item.snapshot || {})
                    .filter(([field]) =>
                      [
                        'orderStatus',
                        'orderType',
                        'tableId',
                        'notes',
                        'deliveryInfo',
                        'estimatedDeliveryTime',
                        'scheduledAt',
                        'customerId',
                      ].includes(field),
                    )
                    .map(([field, value]) => ({ field, change: value }));

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

                {/* Cambios en items (agregados/modificados/eliminados) */}
                {item.diff.items && (
                  <>
                    {item.diff.items.added?.length > 0 && (
                      <>
                        <Text
                          variant="labelSmall"
                          style={{
                            color: theme.colors.success,
                            fontWeight: '600',
                            marginBottom: 6,
                          }}
                        >
                          Productos agregados:
                        </Text>
                        {item.diff.items.added.map(
                          (addedItem: any, idx: number) => (
                            <View
                              key={`added-${idx}`}
                              style={{
                                marginBottom: 8,
                                paddingLeft: 8,
                                borderLeftWidth: 2,
                                borderLeftColor: theme.colors.success + '50',
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
                              {(addedItem.modifiers?.length > 0 ||
                                addedItem.customizations?.length > 0 ||
                                addedItem.notes) && (
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    marginTop: 2,
                                    color: theme.colors.onSurfaceVariant,
                                  }}
                                >
                                  {[
                                    addedItem.modifiers?.length > 0 &&
                                      `Modificadores: ${addedItem.modifiers.join(', ')}`,
                                    addedItem.customizations?.length > 0 &&
                                      `Personalizaciones: ${addedItem.customizations.join(', ')}`,
                                    addedItem.notes &&
                                      `Notas: ${addedItem.notes}`,
                                  ]
                                    .filter(Boolean)
                                    .join(' • ')}
                                </Text>
                              )}
                              <Text
                                variant="labelSmall"
                                style={{
                                  marginTop: 4,
                                  color: theme.colors.primary,
                                  fontWeight: '600',
                                }}
                              >
                                Precio: $
                                {addedItem.finalPrice || addedItem.basePrice}
                              </Text>
                            </View>
                          ),
                        )}
                      </>
                    )}

                    {item.diff.items.removed?.length > 0 && (
                      <>
                        <Text
                          variant="labelSmall"
                          style={{
                            color: theme.colors.error,
                            fontWeight: '600',
                            marginBottom: 6,
                            marginTop: 8,
                          }}
                        >
                          Productos eliminados:
                        </Text>
                        {item.diff.items.removed.map(
                          (removedItem: any, idx: number) => (
                            <View
                              key={`removed-${idx}`}
                              style={{
                                marginBottom: 8,
                                paddingLeft: 8,
                                borderLeftWidth: 2,
                                borderLeftColor: theme.colors.error + '50',
                                backgroundColor: theme.colors.surface,
                                padding: 8,
                                marginLeft: 4,
                                borderRadius: 4,
                              }}
                            >
                              <Text
                                variant="bodySmall"
                                style={{
                                  textDecorationLine: 'line-through',
                                  color: theme.colors.error,
                                }}
                              >
                                {removedItem.productName}
                                {removedItem.variantName
                                  ? ` - ${removedItem.variantName}`
                                  : ''}
                              </Text>
                            </View>
                          ),
                        )}
                      </>
                    )}

                    {item.diff.items.modified?.length > 0 && (
                      <>
                        <Text
                          variant="labelSmall"
                          style={{
                            color: theme.colors.warning || theme.colors.primary,
                            fontWeight: '600',
                            marginBottom: 6,
                            marginTop: 8,
                          }}
                        >
                          Productos modificados:
                        </Text>
                        {item.diff.items.modified.map(
                          (modifiedItem: any, idx: number) => (
                            <View
                              key={`modified-${idx}`}
                              style={{
                                marginBottom: 8,
                                paddingLeft: 8,
                                borderLeftWidth: 2,
                                borderLeftColor:
                                  (theme.colors.warning ||
                                    theme.colors.primary) + '50',
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
                                {modifiedItem.productName}
                                {modifiedItem.variantName
                                  ? ` - ${modifiedItem.variantName}`
                                  : ''}
                              </Text>
                              {modifiedItem.changes &&
                                Object.entries(modifiedItem.changes).map(
                                  ([field, change]: [string, any]) => (
                                    <View key={field} style={{ marginTop: 4 }}>
                                      <Text
                                        variant="labelSmall"
                                        style={{
                                          color: theme.colors.onSurfaceVariant,
                                        }}
                                      >
                                        {formatFieldName(field)}:
                                      </Text>
                                      {renderChangeDetail(change, field)}
                                    </View>
                                  ),
                                )}
                            </View>
                          ),
                        )}
                      </>
                    )}
                  </>
                )}
              </View>
            )}

          {/* Contenido para items individuales */}
          {item.type === 'item' && (
            <View style={styles.changesContainer}>
              {item.operation === 'INSERT' && (
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.success, marginBottom: 8 }}
                >
                  Item agregado:
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
                    Cambios en el item:
                  </Text>
                  {Object.entries(item.formattedChanges).map(
                    ([field, change]) => (
                      <View key={field} style={{ marginBottom: 8 }}>
                        <Text
                          variant="labelSmall"
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            fontWeight: '600',
                            marginBottom: 4,
                          }}
                        >
                          {field}:
                        </Text>
                        {renderChangeDetail(change, field)}
                      </View>
                    ),
                  )}
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
                                'Estado de preparación',
                              ];
                              return allowedFields.some((allowed) =>
                                fieldName.includes(allowed),
                              );
                            })
                            .map(([field, change]) => (
                              <View key={field} style={{ marginBottom: 4 }}>
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                    fontSize: 11,
                                  }}
                                >
                                  {field}:
                                </Text>
                                {renderChangeDetail(change, field)}
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

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orderId,
  orderNumber,
  onBack,
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
        `/api/v1/orders/${orderId}/history`,
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

      return orderHistory;
    },
    enabled: !!orderId,
    staleTime: 30000,
  });

  const renderHistoryItem = ({ item }: { item: HistoryItem }) => {
    return <HistoryItemComponent item={item} theme={theme} />;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="history"
        size={48}
        color={theme.colors.onSurfaceDisabled}
        style={{ opacity: 0.5 }}
      />
      <Text
        variant="bodyLarge"
        style={{
          color: theme.colors.onSurfaceDisabled,
          marginTop: theme.spacing.m,
        }}
      >
        No hay historial disponible
      </Text>
      <Text
        variant="bodySmall"
        style={{
          color: theme.colors.onSurfaceVariant,
          marginTop: theme.spacing.s,
          textAlign: 'center',
        }}
      >
        Los cambios realizados en esta orden aparecerán aquí
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content
          title={`Historial de Orden #${orderNumber || ''}`}
          subtitle={`${historyData?.length || 0} cambios registrados`}
        />
      </Appbar.Header>

      <View style={styles.content}>
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
    </View>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    content: {
      flex: 1,
    },
    listContent: {
      padding: theme.spacing.m,
      paddingBottom: theme.spacing.xl * 2,
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
      // Estructura vertical para evitar encimamiento
    },
    expandedContent: {
      marginTop: theme.spacing.s,
      paddingTop: theme.spacing.s,
    },
    changesContainer: {
      marginTop: theme.spacing.xs,
    },
    changeDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      flexWrap: 'wrap',
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
  });
};
