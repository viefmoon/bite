import React, { useMemo, useState, useCallback } from 'react';
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
import { API_PATHS } from '@/app/constants/apiPaths';

interface HistoryItem {
  id: string | number;
  orderId: string;
  orderItemId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'BATCH';
  changedBy: string;
  changedAt: string;
  diff?: Record<string, unknown> | null;
  snapshot?: Record<string, unknown>;
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
  formattedChanges?: Record<string, unknown>;
  batchOperations?: Record<string, unknown>[];
  type: 'order' | 'item';
}

interface OrderHistoryViewProps {
  orderId: string;
  orderNumber?: number | null;
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
const formatValue = (field: string, value: unknown): string => {
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

  if (
    field === 'tableId' &&
    typeof value === 'object' &&
    value &&
    (value as any).name
  ) {
    return (value as any).name;
  }

  if (
    field === 'estimatedDeliveryTime' ||
    field === 'scheduledAt' ||
    field === 'finalizedAt'
  ) {
    try {
      return format(new Date(String(value)), 'dd/MM/yyyy HH:mm', {
        locale: es,
      });
    } catch {
      return String(value);
    }
  }

  if (field === 'total' || field === 'subtotal') {
    return `$${parseFloat(String(value)).toFixed(2)}`;
  }

  if (field === 'customerId') {
    return String(value) || 'Sin cliente registrado';
  }

  if (field === 'scheduledAt') {
    return value
      ? format(new Date(String(value)), 'dd/MM/yyyy HH:mm', { locale: es })
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

  const renderChangeDetail = useCallback(
    (change: unknown, fieldName?: string) => {
      if (
        change &&
        typeof change === 'object' &&
        (change as any).anterior !== undefined &&
        (change as any).nuevo !== undefined
      ) {
        // Para descripción del item, mostrar en formato vertical si es muy largo
        if (
          (fieldName === 'Descripción del Item' ||
            fieldName === 'Descripción') &&
          (String((change as any).anterior).length > 30 ||
            String((change as any).nuevo).length > 30)
        ) {
          return (
            <View style={styles.marginTop4}>
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={[
                    styles.labelSmallBold,
                    { color: theme.colors.onErrorContainer },
                  ]}
                >
                  Antes:
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onErrorContainer }}
                >
                  {String((change as any).anterior)}
                </Text>
              </View>
              <View
                style={[
                  styles.primaryContainer,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={[
                    styles.labelSmallBold,
                    { color: theme.colors.onPrimaryContainer },
                  ]}
                >
                  Después:
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onPrimaryContainer }}
                >
                  {String((change as any).nuevo)}
                </Text>
              </View>
            </View>
          );
        }
        // Formato horizontal para cambios cortos
        return (
          <View style={styles.changeDetail}>
            <View
              style={[
                styles.errorTag,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.labelSmallMedium,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {String((change as any).anterior)}
              </Text>
            </View>
            <Text
              style={[
                styles.marginHorizontal4,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              →
            </Text>
            <View
              style={[
                styles.primaryTag,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.labelSmallMedium,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                {String((change as any).nuevo)}
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
            <View style={styles.marginTop4}>
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.errorContainer },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={[
                    styles.labelSmallBold,
                    { color: theme.colors.onErrorContainer },
                  ]}
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
                style={[
                  styles.primaryContainer,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Text
                  variant="labelSmall"
                  style={[
                    styles.labelSmallBold,
                    { color: theme.colors.onPrimaryContainer },
                  ]}
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
              style={[
                styles.errorTagLarge,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.labelSmallMedium,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {oldVal}
              </Text>
            </View>
            <Text
              style={[
                styles.marginHorizontal4,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              →
            </Text>
            <View
              style={[
                styles.primaryTagLarge,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.labelSmallMedium,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                {newVal}
              </Text>
            </View>
          </View>
        );
      }
      return null;
    },
    [
      theme,
      styles.changeDetail,
      styles.errorContainer,
      styles.errorTag,
      styles.errorTagLarge,
      styles.labelSmallBold,
      styles.labelSmallMedium,
      styles.marginHorizontal4,
      styles.marginTop4,
      styles.primaryContainer,
      styles.primaryTag,
      styles.primaryTagLarge,
    ],
  );

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
          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoRow}>
              <Avatar.Icon
                size={24}
                icon={getOperationIcon(item.operation, item.type)}
                style={[
                  styles.avatarMargin,
                  {
                    backgroundColor:
                      item.type === 'order'
                        ? theme.colors.primary
                        : theme.colors.secondary,
                  },
                ]}
              />
              <Text
                variant="bodySmall"
                style={styles.userNameText}
                numberOfLines={1}
              >
                {item.changedByUser
                  ? `${item.changedByUser.firstName} ${item.changedByUser.lastName}`
                  : item.user
                    ? `${item.user.firstName} ${item.user.lastName}`
                    : 'Sistema'}
              </Text>
              <View
                style={[
                  styles.expandButton,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <Text
                  style={[
                    styles.expandButtonText,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {expanded ? '▲' : '▼'}
                </Text>
              </View>
            </View>
            <View style={styles.chipContainer}>
              <View
                style={[
                  styles.operationChip,
                  {
                    backgroundColor:
                      (item.type === 'order'
                        ? theme.colors.primary
                        : theme.colors.secondary) + '15',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.operationDot,
                    {
                      color:
                        item.type === 'order'
                          ? theme.colors.primary
                          : theme.colors.secondary,
                    },
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    styles.operationText,
                    {
                      color:
                        item.type === 'order'
                          ? theme.colors.primary
                          : theme.colors.secondary,
                    },
                  ]}
                >
                  {getOperationLabel(item.operation, item.type)}
                </Text>
              </View>
              {item.preparationStatus && (
                <Chip
                  mode="flat"
                  textStyle={styles.statusChipText}
                  style={[
                    styles.statusChipStyle,
                    {
                      backgroundColor:
                        getStatusColor(item.preparationStatus, theme) + '20',
                      transform: [{ scale: 0.8 }],
                    },
                  ]}
                  compact
                >
                  {formatValue('preparationStatus', item.preparationStatus)}
                </Chip>
              )}
              <Text variant="labelSmall" style={styles.timestampText}>
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
          <Divider style={styles.dividerMargin} />
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
                          style={[
                            styles.summaryText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {item.diff.summary}
                        </Text>
                      )}

                      {/* Información de la orden */}
                      {item.diff.order && (
                        <View
                          style={[
                            styles.orderDetailsContainer,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.orderDetailsTitle,
                              { color: theme.colors.primary },
                            ]}
                          >
                            Detalles de la orden:
                          </Text>

                          {item.diff.order.fields?.orderType && (
                            <Text variant="bodySmall" style={styles.fieldRow}>
                              <Text style={styles.fieldLabel}>Tipo:</Text>{' '}
                              {formatValue(
                                'orderType',
                                item.diff.order.fields.orderType[1],
                              )}
                            </Text>
                          )}
                          {item.diff.order.fields?.tableId && (
                            <Text variant="bodySmall" style={styles.fieldRow}>
                              <Text style={styles.fieldLabel}>Mesa:</Text>{' '}
                              {item.snapshot?.table?.name ||
                                `Mesa ${item.diff.order.fields.tableId[1]}`}
                            </Text>
                          )}
                          {item.diff.order.fields?.notes && (
                            <Text variant="bodySmall" style={styles.fieldRow}>
                              <Text style={styles.fieldLabel}>Notas:</Text>{' '}
                              {item.diff.order.fields.notes[1]}
                            </Text>
                          )}

                          {/* Información de entrega */}
                          {item.diff.order.deliveryInfo && (
                            <>
                              {item.diff.order.deliveryInfo.recipientName && (
                                <Text
                                  variant="bodySmall"
                                  style={styles.fieldRow}
                                >
                                  <Text style={styles.fieldLabel}>
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
                                  style={styles.fieldRow}
                                >
                                  <Text style={styles.fieldLabel}>
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
                                  style={styles.fieldRow}
                                >
                                  <Text style={styles.fieldLabel}>
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
                              style={[
                                styles.sectionTitleWithMargins,
                                { color: theme.colors.primary },
                              ]}
                            >
                              Productos incluidos en la orden:
                            </Text>
                            {item.diff.items.added.map(
                              (
                                addedItem: Record<string, unknown>,
                                idx: number,
                              ) => (
                                <View
                                  key={`added-${idx}`}
                                  style={[
                                    styles.productItemBorder,
                                    {
                                      borderLeftColor:
                                        theme.colors.primary + '50',
                                      backgroundColor: theme.colors.surface,
                                    },
                                  ]}
                                >
                                  <Text
                                    variant="bodySmall"
                                    style={styles.productNameText}
                                  >
                                    {addedItem.productName}
                                    {addedItem.variantName
                                      ? ` - ${addedItem.variantName}`
                                      : ''}
                                  </Text>
                                  {addedItem.modifiers?.length > 0 && (
                                    <Text
                                      variant="labelSmall"
                                      style={[
                                        styles.modifierText,
                                        {
                                          color: theme.colors.onSurfaceVariant,
                                        },
                                      ]}
                                    >
                                      Modificadores:{' '}
                                      {addedItem.modifiers.join(', ')}
                                    </Text>
                                  )}
                                  {addedItem.customizations?.length > 0 && (
                                    <Text
                                      variant="labelSmall"
                                      style={[
                                        styles.modifierText,
                                        {
                                          color: theme.colors.onSurfaceVariant,
                                        },
                                      ]}
                                    >
                                      Personalizaciones:{' '}
                                      {addedItem.customizations.join(', ')}
                                    </Text>
                                  )}
                                  {addedItem.notes && (
                                    <Text
                                      variant="labelSmall"
                                      style={[
                                        styles.modifierText,
                                        styles.italicText,
                                      ]}
                                    >
                                      Notas: {addedItem.notes}
                                    </Text>
                                  )}
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.productPriceText,
                                      { color: theme.colors.primary },
                                    ]}
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
                              style={[
                                styles.summaryText,
                                { color: theme.colors.primary },
                              ]}
                            >
                              {changes as string}
                            </Text>
                          );
                        }
                        return (
                          <View key={section} style={styles.sectionMargin}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.orderDetailsTitle,
                                { color: theme.colors.primary },
                              ]}
                            >
                              {section}:
                            </Text>
                            {typeof changes === 'object' &&
                              Object.entries(changes).map(([field, change]) => (
                                <View key={field} style={styles.fieldContainer}>
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.fieldLabelSmall,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
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
                    <Text variant="bodySmall" style={styles.changesEmptyText}>
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
                              style={[
                                styles.summaryText,
                                { color: theme.colors.primary },
                              ]}
                            >
                              {changes as string}
                            </Text>
                          );
                        }
                        return (
                          <View key={section} style={styles.sectionMargin}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.orderDetailsTitle,
                                { color: theme.colors.primary },
                              ]}
                            >
                              {section}:
                            </Text>
                            {typeof changes === 'object' &&
                              Object.entries(changes).map(([field, change]) => (
                                <View key={field} style={styles.fieldContainer}>
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.fieldLabelSmall,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
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
                            style={[
                              styles.summaryText,
                              { color: theme.colors.primary },
                            ]}
                          >
                            {item.diff.summary}
                          </Text>
                        )}
                        {item.diff.order?.fields &&
                          Object.entries(item.diff.order.fields).map(
                            ([field, values]) => (
                              <View
                                key={field}
                                style={styles.changeSectionContainer}
                              >
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.changeSectionTitle,
                                    { color: theme.colors.onSurfaceVariant },
                                  ]}
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
                        style={[
                          styles.changesEmptyText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Cambios en la orden:
                      </Text>
                      {relevantChanges.map(({ field, change }) => (
                        <View key={field} style={styles.changeSectionContainer}>
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.changeSectionTitle,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
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
                    style={[
                      styles.summaryText,
                      { color: theme.colors.primary },
                    ]}
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
                          style={[
                            styles.orderDetailsTitle,
                            { color: theme.colors.success },
                          ]}
                        >
                          Productos agregados:
                        </Text>
                        {item.diff.items.added.map(
                          (addedItem: Record<string, unknown>, idx: number) => (
                            <View
                              key={`added-${idx}`}
                              style={[
                                styles.addedProductContainer,
                                {
                                  borderLeftColor: theme.colors.success + '50',
                                  backgroundColor: theme.colors.surface,
                                },
                              ]}
                            >
                              <Text
                                variant="bodySmall"
                                style={styles.productNameText}
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
                                  style={[
                                    styles.modifierText,
                                    { color: theme.colors.onSurfaceVariant },
                                  ]}
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
                                style={[
                                  styles.productPriceText,
                                  { color: theme.colors.primary },
                                ]}
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
                          style={[
                            styles.sectionTitleWithMargins,
                            { color: theme.colors.error },
                          ]}
                        >
                          Productos eliminados:
                        </Text>
                        {item.diff.items.removed.map(
                          (
                            removedItem: Record<string, unknown>,
                            idx: number,
                          ) => (
                            <View
                              key={`removed-${idx}`}
                              style={[
                                styles.removedProductContainer,
                                {
                                  borderLeftColor: theme.colors.error + '50',
                                  backgroundColor: theme.colors.surface,
                                },
                              ]}
                            >
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.removedProductText,
                                  { color: theme.colors.error },
                                ]}
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
                          style={[
                            styles.sectionTitleWithMargins,
                            {
                              color:
                                theme.colors.warning || theme.colors.primary,
                            },
                          ]}
                        >
                          Productos modificados:
                        </Text>
                        {item.diff.items.modified.map(
                          (modifiedItem: any, idx: number) => (
                            <View
                              key={`modified-${idx}`}
                              style={[
                                styles.productModifiedContainer,
                                {
                                  borderLeftColor:
                                    (theme.colors.warning ||
                                      theme.colors.primary) + '50',
                                  backgroundColor: theme.colors.surface,
                                },
                              ]}
                            >
                              <Text
                                variant="bodySmall"
                                style={styles.productNameText}
                              >
                                {modifiedItem.productName}
                                {modifiedItem.variantName
                                  ? ` - ${modifiedItem.variantName}`
                                  : ''}
                              </Text>
                              {modifiedItem.changes &&
                                Object.entries(modifiedItem.changes).map(
                                  ([field, change]: [string, unknown]) => (
                                    <View
                                      key={field}
                                      style={styles.modifiedChangeContainer}
                                    >
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
                  style={[
                    styles.itemOperationText,
                    { color: theme.colors.success },
                  ]}
                >
                  Item agregado:
                </Text>
              )}
              {item.operation === 'UPDATE' && item.formattedChanges && (
                <>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.changesEmptyText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Cambios en el item:
                  </Text>
                  {Object.entries(item.formattedChanges).map(
                    ([field, change]) => (
                      <View key={field} style={styles.changeSectionContainer}>
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.changeSectionTitle,
                            styles.noTextTransform,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
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
                  style={[
                    styles.itemOperationText,
                    { color: theme.colors.error },
                  ]}
                >
                  Item eliminado:
                </Text>
              )}
              {/* Mostrar la descripción del item para INSERT y DELETE */}
              {(item.operation === 'INSERT' || item.operation === 'DELETE') &&
                item.itemDescription && (
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.itemDescriptionContainer,
                      {
                        color: theme.colors.onSurface,
                        backgroundColor: theme.colors.surface,
                      },
                    ]}
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
                style={[styles.batchTitle, { color: theme.colors.primary }]}
              >
                Cambios realizados en una sola edición:
              </Text>
              {item.batchOperations.map(
                (op: Record<string, unknown>, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.batchOperationContainer,
                      idx < item.batchOperations!.length - 1
                        ? styles.batchOperationMarginBottom
                        : styles.batchOperationNoMargin,
                      {
                        borderLeftColor: theme.colors.primary + '30',
                      },
                    ]}
                  >
                    <View style={styles.batchOperationRow}>
                      <Text
                        style={[
                          styles.batchBulletText,
                          { color: theme.colors.primary },
                        ]}
                      >
                        •
                      </Text>
                      <View style={styles.batchOperationContent}>
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.batchOperationLabel,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {getOperationLabel(op.operation)}
                        </Text>

                        {/* Mostrar descripción del item */}
                        {(op.itemDescription ||
                          op.snapshot?.itemDescription) && (
                          <Text
                            variant="bodySmall"
                            style={[
                              styles.batchItemDescription,
                              {
                                color: theme.colors.onSurface,
                                backgroundColor: theme.colors.surface,
                              },
                            ]}
                          >
                            {op.itemDescription || op.snapshot?.itemDescription}
                          </Text>
                        )}

                        {/* Para UPDATE, mostrar el cambio */}
                        {op.operation === 'UPDATE' && op.formattedChanges && (
                          <View style={styles.batchUpdateMargin}>
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
                                <View
                                  key={field}
                                  style={styles.batchFieldContainer}
                                >
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.batchFieldLabel,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
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
                ),
              )}
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

  const titleText = useMemo(
    () => `Historial de Orden #${orderNumber || ''}`,
    [orderNumber],
  );

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
      const url = `${API_PATHS.ORDERS_HISTORY.replace(':orderId', orderId)}?page=1&limit=100`;
      const orderHistoryResponse = await apiClient.get(url);

      const orderHistory = orderHistoryResponse.data?.data
        ? orderHistoryResponse.data.data.map(
            (item: Record<string, unknown>) => ({
              ...item,
              type: 'order' as const,
            }),
          )
        : [];

      return orderHistory;
    },
    enabled: !!orderId,
    staleTime: 30000,
  });

  const renderHistoryItem = useCallback(
    ({ item }: { item: HistoryItem }) => {
      return <HistoryItemComponent item={item} theme={theme} />;
    },
    [theme],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text
          style={[styles.emptyIcon, { color: theme.colors.onSurfaceDisabled }]}
        >
          📋
        </Text>
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
          style={[
            styles.emptyText,
            {
              color: theme.colors.onSurfaceVariant,
              marginTop: theme.spacing.s,
            },
          ]}
        >
          Los cambios realizados en esta orden aparecerán aquí
        </Text>
      </View>
    ),
    [styles.emptyContainer, styles.emptyIcon, styles.emptyText, theme],
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content
          title={titleText}
          subtitle={`${historyData?.length || 0} cambios registrados`}
        />
      </Appbar.Header>

      <View style={styles.content}>
        {isError ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.errorIcon, { color: theme.colors.error }]}>
              ⚠️
            </Text>
            <Text
              variant="bodyLarge"
              style={[
                styles.emptyText,
                {
                  color: theme.colors.error,
                  marginTop: theme.spacing.m,
                },
              ]}
            >
              Error al cargar el historial
            </Text>
            <Button
              onPress={() => refetch()}
              mode="text"
              style={styles.retryButton}
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
    verticalChangeContainer: {
      marginTop: 4,
    },
    beforeValueContainer: {
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    afterValueContainer: {
      padding: 8,
      borderRadius: 6,
    },
    horizontalBeforeValue: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 6,
    },
    horizontalAfterValue: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    arrowText: {
      marginHorizontal: 4,
    },
    sectionTitle: {
      fontWeight: '600',
      marginBottom: 8,
    },
    itemContainer: {
      marginBottom: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      backgroundColor: theme.colors.surface,
      padding: 8,
      marginLeft: 4,
      borderRadius: 4,
    },
    // Nuevos estilos para reemplazar inline styles
    marginTop4: {
      marginTop: 4,
    },
    errorContainer: {
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    labelSmallBold: {
      fontWeight: '600',
      marginBottom: 4,
    },
    primaryContainer: {
      padding: 8,
      borderRadius: 6,
    },
    errorTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginRight: 6,
    },
    labelSmallMedium: {
      fontWeight: '500',
    },
    marginHorizontal4: {
      marginHorizontal: 4,
    },
    primaryTag: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    errorTagLarge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginRight: 6,
    },
    primaryTagLarge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    userInfoContainer: {
      flex: 1,
      marginRight: 12,
    },
    userInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    avatarMargin: {
      marginRight: 6,
    },
    userNameText: {
      fontWeight: '600',
      flex: 1,
    },
    expandButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    expandButtonText: {
      fontSize: 20,
    },
    chipContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 4,
    },
    operationChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 10,
    },
    operationDot: {
      marginRight: 3,
      fontSize: 10,
    },
    operationText: {
      fontSize: 9,
      fontWeight: '600',
    },
    statusChipText: {
      fontSize: 9,
    },
    statusChipStyle: {
      height: 20,
    },
    timestampText: {
      opacity: 0.6,
      fontSize: 10,
    },
    dividerMargin: {
      marginBottom: 8,
    },
    summaryText: {
      fontWeight: '600',
      marginBottom: 8,
      fontStyle: 'italic',
    },
    orderDetailsContainer: {
      padding: 8,
      borderRadius: 6,
      marginBottom: 8,
    },
    orderDetailsTitle: {
      fontWeight: '600',
      marginBottom: 6,
    },
    fieldRow: {
      marginBottom: 4,
    },
    fieldLabel: {
      fontWeight: '600',
    },
    sectionTitleWithMargins: {
      fontWeight: '600',
      marginBottom: 8,
      marginTop: 8,
    },
    productItemBorder: {
      marginBottom: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      padding: 8,
      marginLeft: 4,
      borderRadius: 4,
    },
    productNameText: {
      fontWeight: '600',
    },
    modifierText: {
      marginTop: 2,
    },
    productPriceText: {
      marginTop: 4,
      fontWeight: '600',
    },
    sectionMargin: {
      marginBottom: 12,
    },
    fieldContainer: {
      marginBottom: 4,
      marginLeft: 8,
    },
    fieldLabelSmall: {
      marginBottom: 2,
    },
    errorColorText: {
      fontWeight: '600',
      marginBottom: 8,
    },
    changeSectionContainer: {
      marginBottom: 8,
    },
    changeSectionTitle: {
      fontWeight: '600',
      marginBottom: 4,
      textTransform: 'capitalize',
    },
    changesEmptyText: {
      fontWeight: '600',
      marginBottom: 8,
    },
    productModifiedContainer: {
      marginBottom: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      padding: 8,
      marginLeft: 4,
      borderRadius: 4,
    },
    addedProductContainer: {
      marginBottom: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      padding: 8,
      marginLeft: 4,
      borderRadius: 4,
    },
    removedProductContainer: {
      marginBottom: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      padding: 8,
      marginLeft: 4,
      borderRadius: 4,
    },
    removedProductText: {
      textDecorationLine: 'line-through',
    },
    modifiedChangeContainer: {
      marginTop: 4,
    },
    itemOperationText: {
      marginBottom: 8,
    },
    itemDescriptionContainer: {
      padding: 8,
      borderRadius: 6,
    },
    batchTitle: {
      fontWeight: '600',
      marginBottom: 8,
    },
    batchOperationContainer: {
      paddingLeft: 8,
      borderLeftWidth: 2,
      marginLeft: 4,
    },
    batchOperationRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    batchBulletText: {
      marginRight: 6,
      marginTop: 2,
      fontSize: 14,
    },
    batchOperationContent: {
      flex: 1,
    },
    batchOperationLabel: {
      fontWeight: '500',
      marginBottom: 4,
    },
    batchItemDescription: {
      padding: 6,
      borderRadius: 4,
    },
    batchUpdateMargin: {
      marginTop: 4,
    },
    batchFieldContainer: {
      marginBottom: 4,
    },
    batchFieldLabel: {
      fontSize: 11,
    },
    emptyIcon: {
      fontSize: 48,
      opacity: 0.5,
    },
    emptyText: {
      textAlign: 'center',
    },
    errorIcon: {
      fontSize: 48,
      opacity: 0.7,
    },
    retryButton: {
      marginTop: 16,
    },
    // Nuevos estilos para reemplazar inline styles
    italicText: {
      fontStyle: 'italic',
    },
    noTextTransform: {
      textTransform: 'none',
    },
    conditionalMarginBottom: {
      // Este estilo será combinado con marginBottom dinámico
    },
    batchOperationMarginBottom: {
      marginBottom: 12,
    },
    batchOperationNoMargin: {
      marginBottom: 0,
    },
  });
};
