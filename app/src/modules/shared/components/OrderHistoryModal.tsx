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
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

interface ChangeDetail {
  anterior: unknown;
  nuevo: unknown;
}

interface OrderDiff {
  summary?: string;
  order?: {
    fields?: Record<string, [unknown, unknown]>;
    deliveryInfo?: Record<string, [unknown, unknown]>;
  };
  items?: {
    added?: Array<{
      productName: string;
      variantName?: string;
      modifiers?: string[];
      customizations?: string[];
      notes?: string;
      price: number;
    }>;
    modified?: Array<{
      before: { productName: string; variantName?: string };
      after: { productName: string; variantName?: string };
    }>;
    removed?: Array<{
      productName: string;
      variantName?: string;
      price?: number;
    }>;
  };
}

interface BatchOperation {
  operation: string;
  itemDescription?: string;
  snapshot?: { itemDescription?: string };
  formattedChanges?: Record<string, ChangeDetail>;
}

interface HistoryItem {
  id: string | number;
  orderId: string;
  orderItemId?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'BATCH';
  changedBy: string;
  changedAt: string;
  diff?: OrderDiff | null;
  snapshot?: {
    orderType?: string;
    tableId?: string;
    table?: { name?: string };
    notes?: string;
  };
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
  formattedChanges?: {
    'Cambios en productos'?: {
      'Productos modificados'?: Array<{ antes: string; después: string }>;
      'Productos agregados'?: string[];
      'Productos eliminados'?: string[];
    };
    [key: string]: ChangeDetail | unknown;
  };
  batchOperations?: BatchOperation[];
  type: 'order' | 'item';
}

interface OrderHistoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
}

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

const getStatusColor = (
  status: string,
  theme: ReturnType<typeof useAppTheme>,
) => {
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

const formatValue = (field: string, value: unknown): string => {
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
    return statusMap[String(value)] || String(value);
  }

  if (field === 'orderType') {
    const typeMap: Record<string, string> = {
      DINE_IN: 'Para Comer Aquí',
      TAKE_AWAY: 'Para Llevar',
      DELIVERY: 'Domicilio',
    };
    return typeMap[String(value)] || String(value);
  }

  if (field === 'table' || field === 'tableId') {
    if (typeof value === 'object' && value !== null && 'name' in value) {
      return (value as { name: string }).name || 'Sin mesa';
    }
    return String(value) || 'Sin mesa';
  }

  // Para datos de entrega
  if (field === 'recipientName') {
    return String(value) || 'Sin nombre';
  }

  if (field === 'recipientPhone') {
    return String(value) || 'Sin teléfono';
  }

  if (field === 'fullAddress') {
    return String(value) || 'Sin dirección';
  }

  if (field === 'isFromWhatsApp') {
    return value ? 'Sí' : 'No';
  }

  if (field === 'customerId') {
    return String(value) || 'Sin cliente registrado';
  }

  if (field === 'scheduledAt') {
    return value
      ? format(new Date(value as string | number | Date), 'dd/MM/yyyy HH:mm', {
          locale: es,
        })
      : 'No programado';
  }

  return String(value);
};

const HistoryItemComponent: React.FC<{
  item: HistoryItem;
  theme: ReturnType<typeof useAppTheme>;
}> = ({ item, theme }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const renderChangeDetail = (change: unknown, fieldName?: string) => {
    if (
      change &&
      typeof change === 'object' &&
      change !== null &&
      'anterior' in change &&
      'nuevo' in change
    ) {
      const changeDetail = change as ChangeDetail;
      if (
        (fieldName === 'Descripción del Item' || fieldName === 'Descripción') &&
        (String(changeDetail.anterior).length > 30 ||
          String(changeDetail.nuevo).length > 30)
      ) {
        return (
          <View style={styles.verticalChangeContainer}>
            <View
              style={[
                styles.changeBlock,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.changeBlockLabel,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                Antes:
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.changeBlockText,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {String(changeDetail.anterior)}
              </Text>
            </View>
            <View
              style={[
                styles.changeBlockAfter,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.changeBlockLabel,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                Después:
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.changeBlockText,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                {String(changeDetail.nuevo)}
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
              styles.horizontalChangeBefore,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.horizontalChangeText,
                { color: theme.colors.onErrorContainer },
              ]}
            >
              {String(changeDetail.anterior)}
            </Text>
          </View>
          <Icon
            name="arrow-right"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.horizontalChangeArrow}
          />
          <View
            style={[
              styles.horizontalChangeAfter,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.horizontalChangeText,
                { color: theme.colors.onPrimaryContainer },
              ]}
            >
              {String(changeDetail.nuevo)}
            </Text>
          </View>
        </View>
      );
    } else if (Array.isArray(change) && change.length === 2) {
      // Para el formato de array [antes, después] - usado en cambios de orden
      const oldVal = formatValue(fieldName || '', (change as any[])[0]);
      const newVal = formatValue(fieldName || '', (change as any[])[1]);

      // Para campos largos o especiales, usar formato vertical
      if (
        fieldName &&
        ['notes', 'deliveryInfo', 'customerName', 'deliveryAddress'].includes(
          fieldName,
        )
      ) {
        return (
          <View style={styles.verticalChangeContainer}>
            <View
              style={[
                styles.changeBlock,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.changeBlockLabel,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                Antes:
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.changeBlockText,
                  { color: theme.colors.onErrorContainer },
                ]}
              >
                {oldVal}
              </Text>
            </View>
            <View
              style={[
                styles.changeBlockAfter,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              <Text
                variant="labelSmall"
                style={[
                  styles.changeBlockLabel,
                  { color: theme.colors.onPrimaryContainer },
                ]}
              >
                Después:
              </Text>
              <Text
                variant="bodySmall"
                style={[
                  styles.changeBlockText,
                  { color: theme.colors.onPrimaryContainer },
                ]}
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
              styles.horizontalChangeBefore,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.horizontalChangeText,
                { color: theme.colors.onErrorContainer },
              ]}
            >
              {oldVal}
            </Text>
          </View>
          <Icon
            name="arrow-right"
            size={16}
            color={theme.colors.onSurfaceVariant}
            style={styles.horizontalChangeArrow}
          />
          <View
            style={[
              styles.horizontalChangeAfter,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text
              variant="labelSmall"
              style={[
                styles.horizontalChangeText,
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
          <View style={styles.historyHeaderContent}>
            <View style={styles.historyHeaderTop}>
              <Avatar.Icon
                size={24}
                icon={getOperationIcon(item.operation, item.type)}
                style={[
                  styles.operationAvatar,
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
                <Icon
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            <View style={styles.historyHeaderBottom}>
              <View
                style={[
                  styles.operationBadge,
                  {
                    backgroundColor:
                      (item.type === 'order'
                        ? theme.colors.primary
                        : theme.colors.secondary) + '15',
                  },
                ]}
              >
                <Icon
                  name={getOperationIcon(item.operation, item.type)}
                  size={10}
                  color={
                    item.type === 'order'
                      ? theme.colors.primary
                      : theme.colors.secondary
                  }
                  style={styles.operationBadgeIcon}
                />
                <Text
                  style={[
                    styles.operationBadgeText,
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
                    styles.statusChip,
                    {
                      backgroundColor:
                        getStatusColor(item.preparationStatus, theme) + '20',
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
          <Divider style={styles.dividerSpacing} />

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
                          {String(item.diff.summary)}
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
                            <Text
                              variant="bodySmall"
                              style={styles.orderDetailItem}
                            >
                              <Text style={styles.fieldLabel}>Tipo:</Text>{' '}
                              {formatValue(
                                'orderType',
                                item.diff.order.fields.orderType[1],
                              )}
                            </Text>
                          )}
                          {item.diff.order.fields?.tableId && (
                            <Text
                              variant="bodySmall"
                              style={styles.orderDetailItem}
                            >
                              <Text style={styles.fieldLabel}>Mesa:</Text>{' '}
                              {item.snapshot?.table?.name ||
                                `Mesa ${String(item.diff.order.fields.tableId[1])}`}
                            </Text>
                          )}
                          {item.diff.order.fields?.notes && (
                            <Text
                              variant="bodySmall"
                              style={styles.orderDetailItem}
                            >
                              <Text style={styles.fieldLabel}>Notas:</Text>{' '}
                              {String(item.diff.order.fields.notes[1])}
                            </Text>
                          )}

                          {/* Información de entrega */}
                          {item.diff.order.deliveryInfo && (
                            <>
                              {item.diff.order.deliveryInfo.recipientName && (
                                <Text
                                  variant="bodySmall"
                                  style={styles.deliveryInfoText}
                                >
                                  <Text style={styles.fieldLabel}>
                                    Cliente:
                                  </Text>{' '}
                                  {String(
                                    item.diff.order.deliveryInfo
                                      .recipientName[1],
                                  )}
                                </Text>
                              )}
                              {item.diff.order.deliveryInfo.recipientPhone && (
                                <Text
                                  variant="bodySmall"
                                  style={styles.deliveryInfoText}
                                >
                                  <Text style={styles.fieldLabel}>
                                    Teléfono:
                                  </Text>{' '}
                                  {String(
                                    item.diff.order.deliveryInfo
                                      .recipientPhone[1],
                                  )}
                                </Text>
                              )}
                              {item.diff.order.deliveryInfo.fullAddress && (
                                <Text
                                  variant="bodySmall"
                                  style={styles.deliveryInfoText}
                                >
                                  <Text style={styles.fieldLabel}>
                                    Dirección:
                                  </Text>{' '}
                                  {String(
                                    item.diff.order.deliveryInfo.fullAddress[1],
                                  )}
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
                                styles.sectionTitle,
                                { color: theme.colors.primary },
                              ]}
                            >
                              Productos incluidos en la orden:
                            </Text>
                            {item.diff.items.added.map(
                              (addedItem, idx: number) => (
                                <View
                                  key={`added-${idx}`}
                                  style={[
                                    styles.productItemContainer,
                                    {
                                      borderLeftColor:
                                        theme.colors.primary + '50',
                                      backgroundColor: theme.colors.surface,
                                    },
                                  ]}
                                >
                                  <Text
                                    variant="bodySmall"
                                    style={styles.productName}
                                  >
                                    {addedItem.productName}
                                    {addedItem.variantName
                                      ? ` - ${addedItem.variantName}`
                                      : ''}
                                  </Text>
                                  {addedItem.modifiers &&
                                    addedItem.modifiers.length > 0 && (
                                      <Text
                                        variant="labelSmall"
                                        style={[
                                          styles.productDetail,
                                          {
                                            color:
                                              theme.colors.onSurfaceVariant,
                                          },
                                        ]}
                                      >
                                        Modificadores:{' '}
                                        {addedItem.modifiers.join(', ')}
                                      </Text>
                                    )}
                                  {addedItem.customizations &&
                                    addedItem.customizations.length > 0 && (
                                      <Text
                                        variant="labelSmall"
                                        style={[
                                          styles.productDetail,
                                          {
                                            color:
                                              theme.colors.onSurfaceVariant,
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
                                      style={styles.productNotes}
                                    >
                                      Notas: {addedItem.notes}
                                    </Text>
                                  )}
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.productPrice,
                                      { color: theme.colors.primary },
                                    ]}
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
                        style={[
                          styles.fallbackTitle,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Nueva orden creada
                      </Text>
                      {item.snapshot && (
                        <View
                          style={[
                            styles.snapshotContainer,
                            { backgroundColor: theme.colors.surface },
                          ]}
                        >
                          {item.snapshot.orderType && (
                            <Text
                              variant="bodySmall"
                              style={styles.orderDetailItem}
                            >
                              <Text style={styles.fieldLabel}>Tipo:</Text>{' '}
                              {formatValue(
                                'orderType',
                                item.snapshot.orderType,
                              )}
                            </Text>
                          )}
                          {item.snapshot.tableId && (
                            <Text
                              variant="bodySmall"
                              style={styles.orderDetailItem}
                            >
                              <Text style={styles.fieldLabel}>Mesa:</Text>{' '}
                              {item.snapshot.table?.name ||
                                'Mesa ' + item.snapshot.tableId}
                            </Text>
                          )}
                          {item.snapshot.notes && (
                            <Text variant="bodySmall">
                              <Text style={styles.fieldLabel}>Notas:</Text>{' '}
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
                          ([subField, subChange]: [string, unknown]) => ({
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
                        style={[
                          styles.updateFallbackText,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
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
                          styles.orderChangesTitle,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Cambios en la orden:
                      </Text>
                      {relevantChanges.map(({ field, change }) => (
                        <View key={field} style={styles.changeItemContainer}>
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.fieldNameText,
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
                <Text
                  variant="bodySmall"
                  style={[
                    styles.itemDeletedText,
                    { color: theme.colors.error },
                  ]}
                >
                  La orden fue eliminada
                </Text>
              )}
            </View>
          )}

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
                    {String(item.diff.summary)}
                  </Text>
                )}

                {/* Cambios en la orden */}
                {item.diff.order?.fields && (
                  <>
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.orderChangesTitle,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Cambios en la orden:
                    </Text>
                    {Object.entries(item.diff.order.fields).map(
                      ([field, change]) => (
                        <View key={field} style={styles.changeItemContainer}>
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.fieldNameText,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
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
                      style={[
                        styles.orderChangesTitle,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Cambios en información de entrega:
                    </Text>
                    {Object.entries(item.diff.order.deliveryInfo).map(
                      ([field, change]) => (
                        <View key={field} style={styles.changeItemContainer}>
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.fieldNameText,
                              { color: theme.colors.onSurfaceVariant },
                            ]}
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
                        style={[
                          styles.orderChangesTitle,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Cambios en productos:
                      </Text>

                      {/* Productos modificados - diseño mejorado */}
                      {item.formattedChanges['Cambios en productos'][
                        'Productos modificados'
                      ] && (
                        <View style={styles.modifiedProductsContainer}>
                          {(
                            item.formattedChanges['Cambios en productos'][
                              'Productos modificados'
                            ] as Array<{ antes: string; después: string }>
                          ).map((modItem, idx: number) => (
                            <View
                              key={`mod-${idx}`}
                              style={[
                                styles.modifiedProductContainer,
                                {
                                  backgroundColor: theme.colors.surfaceVariant,
                                  borderRadius: theme.roundness * 2,
                                },
                              ]}
                            >
                              {/* Header del cambio */}
                              <View
                                style={[
                                  styles.modifiedProductHeader,
                                  {
                                    backgroundColor:
                                      theme.colors.warning + '20',
                                    borderBottomColor:
                                      theme.colors.warning + '30',
                                  },
                                ]}
                              >
                                <Icon
                                  name="pencil"
                                  size={16}
                                  color={theme.colors.warning}
                                  style={styles.modifiedProductIcon}
                                />
                                <Text
                                  variant="labelMedium"
                                  style={[
                                    styles.modifiedProductTitle,
                                    { color: theme.colors.warning },
                                  ]}
                                >
                                  Producto modificado
                                </Text>
                              </View>

                              {/* Contenido del cambio */}
                              <View style={styles.modifiedProductContent}>
                                <View
                                  style={[
                                    styles.modifiedProductComparison,
                                    {
                                      backgroundColor: theme.colors.surface,
                                      borderRadius: theme.roundness,
                                    },
                                  ]}
                                >
                                  {/* Antes */}
                                  <View style={styles.modifiedProductBefore}>
                                    <Text
                                      variant="labelSmall"
                                      style={[
                                        styles.modifiedProductLabel,
                                        { color: theme.colors.error },
                                      ]}
                                    >
                                      Antes
                                    </Text>
                                    <Text
                                      variant="bodySmall"
                                      style={[
                                        styles.modifiedProductOldValue,
                                        {
                                          color: theme.colors.onSurfaceVariant,
                                        },
                                      ]}
                                    >
                                      {modItem.antes}
                                    </Text>
                                  </View>

                                  {/* Flecha */}
                                  <View style={styles.modifiedProductArrow}>
                                    <Icon
                                      name="arrow-right-thick"
                                      size={24}
                                      color={theme.colors.primary}
                                    />
                                  </View>

                                  {/* Después */}
                                  <View style={styles.modifiedProductAfter}>
                                    <Text
                                      variant="labelSmall"
                                      style={[
                                        styles.modifiedProductLabelAfter,
                                        { color: theme.colors.primary },
                                      ]}
                                    >
                                      Después
                                    </Text>
                                    <Text
                                      variant="bodySmall"
                                      style={[
                                        styles.modifiedProductNewValue,
                                        { color: theme.colors.primary },
                                      ]}
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
                          {(
                            item.formattedChanges['Cambios en productos'][
                              'Productos agregados'
                            ] as string[]
                          ).map((product: string, idx: number) => (
                            <View
                              key={`added-${idx}`}
                              style={[
                                styles.productChangeItem,
                                {
                                  borderLeftColor: theme.colors.success + '50',
                                },
                              ]}
                            >
                              <View style={styles.productChangeContent}>
                                <Icon
                                  name="plus-circle"
                                  size={14}
                                  color={theme.colors.success}
                                  style={styles.productChangeIcon}
                                />
                                <View style={styles.productChangeText}>
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.productChangeLabel,
                                      { color: theme.colors.success },
                                    ]}
                                  >
                                    Producto agregado
                                  </Text>
                                  <Text
                                    variant="bodySmall"
                                    style={styles.productChangeValue}
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
                          {(
                            item.formattedChanges['Cambios en productos'][
                              'Productos eliminados'
                            ] as string[]
                          ).map((product: string, idx: number) => (
                            <View
                              key={`removed-${idx}`}
                              style={[
                                styles.productChangeItem,
                                { borderLeftColor: theme.colors.error + '50' },
                              ]}
                            >
                              <View style={styles.productChangeContent}>
                                <Icon
                                  name="delete"
                                  size={14}
                                  color={theme.colors.error}
                                  style={styles.productChangeIcon}
                                />
                                <View style={styles.productChangeText}>
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.productChangeLabel,
                                      { color: theme.colors.error },
                                    ]}
                                  >
                                    Producto eliminado
                                  </Text>
                                  <Text
                                    variant="bodySmall"
                                    style={styles.productChangeValue}
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
                        style={[
                          styles.orderChangesTitle,
                          { color: theme.colors.primary },
                        ]}
                      >
                        Cambios en productos:
                      </Text>

                      {/* Items agregados */}
                      {item.diff.items.added?.map((addedItem, idx: number) => (
                        <View
                          key={`added-${idx}`}
                          style={[
                            styles.productItemsContainer,
                            { borderLeftColor: theme.colors.success + '50' },
                          ]}
                        >
                          <View style={styles.productItemRowContent}>
                            <Icon
                              name="plus-circle"
                              size={14}
                              color={theme.colors.success}
                              style={styles.productItemIcon}
                            />
                            <View style={styles.productItemDetails}>
                              <Text
                                variant="labelSmall"
                                style={[
                                  styles.productItemLabel,
                                  { color: theme.colors.success },
                                ]}
                              >
                                Producto agregado
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={styles.productItemName}
                              >
                                {addedItem.productName}
                                {addedItem.variantName
                                  ? ` - ${addedItem.variantName}`
                                  : ''}
                              </Text>
                              {addedItem.modifiers &&
                                addedItem.modifiers.length > 0 && (
                                  <Text
                                    variant="labelSmall"
                                    style={[
                                      styles.productItemModifiers,
                                      { color: theme.colors.onSurfaceVariant },
                                    ]}
                                  >
                                    Modificadores:{' '}
                                    {addedItem.modifiers.join(', ')}
                                  </Text>
                                )}
                              {addedItem.price && (
                                <Text
                                  variant="labelSmall"
                                  style={styles.productItemPrice}
                                >
                                  Precio: ${addedItem.price}
                                </Text>
                              )}
                            </View>
                          </View>
                        </View>
                      ))}

                      {/* Items modificados - Solo mostrar antes y después */}
                      {item.diff.items.modified?.map((modItem, idx: number) => (
                        <View
                          key={`mod-${idx}`}
                          style={[
                            styles.productItemsContainer,
                            { borderLeftColor: theme.colors.warning + '50' },
                          ]}
                        >
                          <View style={styles.productItemRowContent}>
                            <Icon
                              name="pencil"
                              size={14}
                              color={theme.colors.warning}
                              style={styles.productItemIcon}
                            />
                            <View style={styles.productItemDetails}>
                              <Text
                                variant="labelSmall"
                                style={[
                                  styles.productItemLabel,
                                  { color: theme.colors.warning },
                                ]}
                              >
                                Producto modificado
                              </Text>
                              <View style={styles.productModifiedComparison}>
                                <View
                                  style={[
                                    styles.productModifiedBefore,
                                    {
                                      backgroundColor:
                                        theme.colors.errorContainer,
                                    },
                                  ]}
                                >
                                  <Text
                                    variant="bodySmall"
                                    style={[
                                      styles.productModifiedText,
                                      { color: theme.colors.onErrorContainer },
                                    ]}
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
                                  style={styles.productModifiedArrowIcon}
                                />
                                <View
                                  style={[
                                    styles.productModifiedAfter,
                                    {
                                      backgroundColor:
                                        theme.colors.primaryContainer,
                                    },
                                  ]}
                                >
                                  <Text
                                    variant="bodySmall"
                                    style={[
                                      styles.productModifiedText,
                                      {
                                        color: theme.colors.onPrimaryContainer,
                                      },
                                    ]}
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
                      ))}

                      {/* Items eliminados */}
                      {item.diff.items.removed?.map(
                        (removedItem, idx: number) => (
                          <View
                            key={`removed-${idx}`}
                            style={[
                              styles.productItemsContainer,
                              { borderLeftColor: theme.colors.error + '50' },
                            ]}
                          >
                            <View style={styles.productItemRowContent}>
                              <Icon
                                name="delete"
                                size={14}
                                color={theme.colors.error}
                                style={styles.productItemIcon}
                              />
                              <View style={styles.productItemDetails}>
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.productItemLabel,
                                    { color: theme.colors.error },
                                  ]}
                                >
                                  Producto eliminado
                                </Text>
                                <Text
                                  variant="bodySmall"
                                  style={styles.productItemName}
                                >
                                  {removedItem.productName}
                                  {removedItem.variantName
                                    ? ` - ${removedItem.variantName}`
                                    : ''}
                                </Text>
                                {removedItem.price && (
                                  <Text
                                    variant="labelSmall"
                                    style={styles.productItemPrice}
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

          {item.type === 'item' && item.operation !== 'BATCH' && (
            <View style={styles.changesContainer}>
              {item.operation === 'INSERT' && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.orderChangesTitle,
                    { color: theme.colors.primary },
                  ]}
                >
                  Nuevo item agregado:
                </Text>
              )}
              {item.operation === 'UPDATE' && item.formattedChanges && (
                <>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.orderChangesTitle,
                      { color: theme.colors.primary },
                    ]}
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
                      <View key={fieldName} style={styles.changeFieldContainer}>
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.changeFieldLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
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
                  style={[
                    styles.itemDeletedText,
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

          {item.operation === 'BATCH' && item.batchOperations && (
            <View style={styles.changesContainer}>
              <Text
                variant="bodySmall"
                style={[
                  styles.orderChangesTitle,
                  { color: theme.colors.primary },
                ]}
              >
                Cambios realizados en una sola edición:
              </Text>
              {item.batchOperations.map((op, idx: number) => (
                <View
                  key={idx}
                  style={[
                    styles.batchOperationContainer,
                    idx < item.batchOperations!.length - 1 &&
                      styles.batchOperationSpacing,
                    {
                      borderLeftColor: theme.colors.primary + '30',
                    },
                  ]}
                >
                  <View style={styles.batchOperationHeader}>
                    <Icon
                      name={getOperationIcon(op.operation)}
                      size={14}
                      color={theme.colors.primary}
                      style={styles.batchOperationIcon}
                    />
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
                      {(op.itemDescription || op.snapshot?.itemDescription) && (
                        <Text
                          variant="bodySmall"
                          style={[
                            styles.batchOperationDescription,
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
                        <View style={styles.batchOperationChanges}>
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
                              <View
                                key={fieldName}
                                style={styles.batchOperationFieldContainer}
                              >
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.batchOperationFieldLabel,
                                    { color: theme.colors.onSurfaceVariant },
                                  ]}
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
          params: {
            page: 1,
            limit: 100,
          },
        },
      );

      const orderHistory =
        orderHistoryResponse.status === 200 && orderHistoryResponse.data?.data
          ? orderHistoryResponse.data.data.map((item: unknown) => ({
              ...(item as Record<string, unknown>),
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
        style={styles.emptyIcon}
      />
      <Text
        variant="bodyLarge"
        style={[
          styles.headerSubtitle,
          {
            color: theme.colors.onSurfaceVariant,
            marginTop: theme.spacing.m,
          },
        ]}
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
        <View style={styles.headerTitleContainer}>
          <Text
            variant="titleMedium"
            style={[styles.headerTitle, { color: theme.colors.onSurface }]}
            numberOfLines={1}
          >
            Historial de Orden #{orderNumber || ''}
          </Text>
          <Text
            variant="bodySmall"
            style={[
              styles.headerSubtitle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {historyData?.length || 0} cambios registrados
          </Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          style={[
            styles.closeButton,
            { backgroundColor: theme.colors.errorContainer },
          ]}
          activeOpacity={0.8}
        >
          <Icon name="close" size={24} color={theme.colors.onErrorContainer} />
        </TouchableOpacity>
      </View>

      <Divider />

      <View style={styles.contentContainer}>
        {isError ? (
          <View style={styles.emptyContainer}>
            <Icon
              name="alert-circle"
              size={48}
              color={theme.colors.error}
              style={styles.errorIcon}
            />
            <Text
              variant="bodyLarge"
              style={[
                styles.errorText,
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
    modifiedProductContainer: {
      marginBottom: 12,
      padding: theme.spacing.s,
    },
    modifiedProductHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
      borderBottomWidth: 1,
    },
    modifiedProductIcon: {
      marginRight: theme.spacing.xs,
    },
    modifiedProductTitle: {
      fontWeight: '600',
    },
    modifiedProductContent: {
      padding: theme.spacing.s,
    },
    modifiedProductComparison: {
      padding: theme.spacing.s,
    },
    modifiedProductBefore: {
      marginBottom: theme.spacing.xs,
    },
    modifiedProductArrow: {
      alignItems: 'center',
      marginVertical: theme.spacing.xs,
    },
    modifiedProductAfter: {
      marginTop: theme.spacing.xs,
    },
    modifiedProductLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    modifiedProductOldValue: {
      fontSize: 13,
    },
    modifiedProductLabelAfter: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    modifiedProductNewValue: {
      fontSize: 13,
      fontWeight: '600',
    },
    productChangeItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
      paddingLeft: theme.spacing.s,
      borderLeftWidth: 3,
    },
    productChangeContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
    },
    productChangeIcon: {
      marginRight: theme.spacing.xs,
      marginTop: 2,
    },
    productChangeText: {
      flex: 1,
    },
    productChangeLabel: {
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2,
    },
    productChangeValue: {
      fontSize: 13,
    },
    // Nuevos estilos para reemplazar inline styles
    dividerSpacing: {
      marginBottom: 8,
    },
    deliveryInfoText: {
      marginBottom: 4,
    },
    updateFallbackText: {
      color: theme.colors.onSurfaceVariant,
    },
    modifiedProductsContainer: {
      marginTop: 8,
    },
    productItemsContainer: {
      marginBottom: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
    },
    productItemRowContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    productItemIcon: {
      marginRight: 6,
      marginTop: 2,
    },
    productItemDetails: {
      flex: 1,
    },
    productItemLabel: {
      fontWeight: '600',
    },
    productItemName: {
      marginTop: 2,
    },
    productItemModifiers: {
      marginTop: 2,
    },
    productItemPrice: {
      marginTop: 2,
      fontWeight: '600',
    },
    productModifiedComparison: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginTop: 4,
    },
    productModifiedBefore: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginRight: 6,
      marginTop: 4,
    },
    productModifiedText: {
      // Color será aplicado desde el componente
    },
    productModifiedArrowIcon: {
      marginHorizontal: 4,
      marginTop: 4,
    },
    productModifiedAfter: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginTop: 4,
    },
    changeFieldContainer: {
      marginBottom: 8,
    },
    changeFieldLabel: {
      fontWeight: '600',
      marginBottom: 4,
    },
    itemDeletedText: {
      marginBottom: 8,
    },
    itemDescriptionContainer: {
      padding: 8,
      borderRadius: 6,
    },
    batchOperationContainer: {
      paddingLeft: 8,
      borderLeftWidth: 2,
      marginLeft: 4,
    },
    batchOperationSpacing: {
      marginBottom: 12,
    },
    batchOperationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    batchOperationIcon: {
      marginRight: 6,
      marginTop: 2,
    },
    batchOperationContent: {
      flex: 1,
    },
    batchOperationLabel: {
      fontWeight: '500',
      marginBottom: 4,
    },
    batchOperationDescription: {
      padding: 6,
      borderRadius: 4,
    },
    batchOperationChanges: {
      marginTop: 4,
    },
    batchOperationFieldContainer: {
      marginBottom: 4,
    },
    batchOperationFieldLabel: {
      fontWeight: '500',
      fontSize: 11,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    headerSubtitle: {
      marginTop: 2,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    contentContainer: {
      flex: 1,
    },
    errorIcon: {
      opacity: 0.7,
    },
    errorText: {
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 16,
    },
    emptyIcon: {
      opacity: 0.5,
    },
  });
};

export default OrderHistoryModal;
