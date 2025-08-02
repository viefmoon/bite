import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Divider, Chip, Avatar, Surface, IconButton } from 'react-native-paper';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { HistoryItem } from '../types/orderHistory';
import {
  getOperationIcon,
  getOperationLabel,
  getPreparationStatusColor,
  formatValue,
  safeStringify,
  formatFieldName,
} from '../utils/orderHistoryUtils';
import { ChangeDetailRenderer } from './ChangeDetailRenderer';
import { ProductItemRenderer } from './ProductItemRenderer';
import { OrderDetailsSection } from './OrderDetailsSection';
import { BatchOperationsSection } from './BatchOperationsSection';
import { createStyles } from '../styles/orderHistoryStyles';

interface HistoryItemComponentProps {
  item: HistoryItem;
  theme: ReturnType<typeof useAppTheme>;
}

export const HistoryItemComponent: React.FC<HistoryItemComponentProps> = ({
  item,
  theme,
}) => {
  const [expanded, setExpanded] = useState(false);
  const styles = useMemo(() => createStyles(theme), [theme]);


  const getUserDisplayName = (
    changedByUser?: HistoryItem['changedByUser'],
    user?: HistoryItem['user'],
  ): string => {
    if (changedByUser?.firstName && changedByUser?.lastName) {
      return `${changedByUser.firstName} ${changedByUser.lastName}`;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Usuario no especificado';
  };

  return (
    <Surface style={styles.historyItem} elevation={1}>
      <TouchableOpacity
        style={styles.historyItemHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.historyItemContent}>
          <View style={styles.historyItemLeft}>
            <Avatar.Icon
              size={40}
              icon={getOperationIcon(item.operation, item.type)}
              style={[
                styles.operationIcon,
                {
                  backgroundColor:
                    item.type === 'order'
                      ? theme.colors.primaryContainer
                      : theme.colors.secondaryContainer,
                },
              ]}
              theme={{
                colors: {
                  onSurface:
                    item.type === 'order'
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSecondaryContainer,
                },
              }}
            />
            <View style={styles.historyItemInfo}>
              <View style={styles.operationBadgeRow}>
                <View
                  style={[
                    styles.operationBadge,
                    {
                      backgroundColor:
                        item.type === 'order'
                          ? theme.colors.primary + '20'
                          : theme.colors.secondary + '20',
                    },
                  ]}
                >
                  <Text
                    variant="labelSmall"
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
                          getPreparationStatusColor(
                            item.preparationStatus,
                            theme,
                          ) + '20',
                      },
                    ]}
                    compact
                  >
                    {formatValue('preparationStatus', item.preparationStatus)}
                  </Chip>
                )}
              </View>
              <Text variant="labelSmall" style={styles.userText}>
                {getUserDisplayName(item.changedByUser, item.user)}
              </Text>
              {/* Mostrar resumen rápido si existe */}
              {item.formattedChanges?.Resumen && (
                <Text 
                  variant="bodySmall" 
                  style={[
                    styles.quickSummary,
                    { color: theme.colors.onSurfaceVariant }
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {safeStringify(item.formattedChanges.Resumen)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.historyItemRight}>
            {item.preparationStatus && (
              <Chip
                mode="flat"
                textStyle={styles.statusChipText}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor:
                      getPreparationStatusColor(item.preparationStatus, theme) +
                      '20',
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
            <IconButton
              icon={expanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              style={{ margin: 0 }}
              onPress={() => setExpanded(!expanded)}
            />
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
                  {/* Mostrar información de creación de orden */}
                  <View style={styles.summaryContainer}>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.summaryText,
                        { color: theme.colors.primary, fontWeight: '600' },
                      ]}
                    >
                      🎉 Orden creada
                    </Text>
                  </View>

                  {/* Mostrar detalles desde el snapshot */}
                  {item.snapshot && (
                    <>
                      {/* Información básica de la orden */}
                      <View style={styles.sectionContainer}>
                        <Text
                          variant="labelMedium"
                          style={[
                            styles.sectionTitle,
                            { color: theme.colors.primary },
                          ]}
                        >
                          📝 Detalles de la orden:
                        </Text>
                        <View style={styles.changeRow}>
                          <Text
                            variant="labelSmall"
                            style={[
                              styles.fieldLabel,
                              { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                            ]}
                          >
                            • Tipo: {formatValue('orderType', (item.snapshot as any)?.orderType)}
                          </Text>
                        </View>
                        {(item.snapshot as any)?.total && (
                          <View style={styles.changeRow}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.fieldLabel,
                                { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                              ]}
                            >
                              • Total: ${(item.snapshot as any)?.total}
                            </Text>
                          </View>
                        )}
                        {(item.snapshot as any)?.orderStatus && (
                          <View style={styles.changeRow}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.fieldLabel,
                                { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                              ]}
                            >
                              • Estado: {formatValue('orderStatus', (item.snapshot as any)?.orderStatus)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Productos incluidos */}
                      {(item.snapshot as any)?.orderItems && Array.isArray((item.snapshot as any)?.orderItems) && (item.snapshot as any)?.orderItems?.length > 0 && (
                        <View style={styles.sectionContainer}>
                          <Text
                            variant="labelMedium"
                            style={[
                              styles.sectionTitle,
                              { color: theme.colors.tertiary },
                            ]}
                          >
                            🍕 Productos incluidos:
                          </Text>
                          {((item.snapshot as any)?.orderItems || []).map((orderItem: any, idx: number) => (
                            <View key={idx} style={styles.productSection}>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.productItem,
                                  { color: theme.colors.onSurface, fontWeight: '500' },
                                ]}
                              >
                                • {orderItem.productName}{orderItem.variantName ? ` - ${orderItem.variantName}` : ''}
                              </Text>
                              {orderItem.customizations && orderItem.customizations.length > 0 && (
                                <Text
                                  variant="bodySmall"
                                  style={[
                                    styles.productItem,
                                    {
                                      color: theme.colors.onSurfaceVariant,
                                      marginLeft: theme.spacing.l,
                                      fontStyle: 'italic',
                                    },
                                  ]}
                                >
                                  Personalizaciones: {orderItem.customizations.join(', ')}
                                </Text>
                              )}
                              {orderItem.preparationNotes && (
                                <Text
                                  variant="bodySmall"
                                  style={[
                                    styles.productItem,
                                    {
                                      color: theme.colors.onSurfaceVariant,
                                      marginLeft: theme.spacing.l,
                                      fontStyle: 'italic',
                                    },
                                  ]}
                                >
                                  Notas: {orderItem.preparationNotes}
                                </Text>
                              )}
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.productItem,
                                  {
                                    color: theme.colors.primary,
                                    marginLeft: theme.spacing.l,
                                  },
                                ]}
                              >
                                Precio: ${orderItem.finalPrice}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Información de entrega si existe */}
                      {(item.snapshot as any)?.deliveryInfo && (
                        <View style={styles.sectionContainer}>
                          <Text
                            variant="labelMedium"
                            style={[
                              styles.sectionTitle,
                              { color: theme.colors.secondary },
                            ]}
                          >
                            🚚 Información de entrega:
                          </Text>
                          {(item.snapshot as any)?.deliveryInfo?.recipientName && (
                            <View style={styles.changeRow}>
                              <Text
                                variant="labelSmall"
                                style={[
                                  styles.fieldLabel,
                                  { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                                ]}
                              >
                                • Destinatario: {(item.snapshot as any)?.deliveryInfo?.recipientName}
                              </Text>
                            </View>
                          )}
                          {(item.snapshot as any)?.deliveryInfo?.recipientPhone && (
                            <View style={styles.changeRow}>
                              <Text
                                variant="labelSmall"
                                style={[
                                  styles.fieldLabel,
                                  { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                                ]}
                              >
                                • Teléfono: {(item.snapshot as any)?.deliveryInfo?.recipientPhone}
                              </Text>
                            </View>
                          )}
                          {(item.snapshot as any)?.deliveryInfo?.fullAddress && (
                            <View style={styles.changeRow}>
                              <Text
                                variant="labelSmall"
                                style={[
                                  styles.fieldLabel,
                                  { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                                ]}
                              >
                                • Dirección: {(item.snapshot as any)?.deliveryInfo?.fullAddress}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Renderizado de otros tipos de operaciones para órdenes */}
              {item.operation === 'UPDATE' && item.formattedChanges && (
                <>
                  {/* Mostrar resumen si existe */}
                  {item.formattedChanges.Resumen && (
                    <View style={styles.summaryContainer}>
                      <Text
                        variant="bodyMedium"
                        style={[
                          styles.summaryText,
                          { color: theme.colors.primary, fontWeight: '600' },
                        ]}
                      >
                        📝 {safeStringify(item.formattedChanges.Resumen)}
                      </Text>
                    </View>
                  )}

                  {/* Cambios en la orden */}
                  {item.formattedChanges['Cambios en la orden'] && (
                    <View style={styles.sectionContainer}>
                      <Text
                        variant="labelMedium"
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.primary },
                        ]}
                      >
                        🏷️ Cambios en la orden:
                      </Text>
                      {Object.entries(item.formattedChanges['Cambios en la orden'] as Record<string, any>).map(
                        ([field, change]) => (
                          <View key={field} style={styles.changeRow}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.fieldLabel,
                                { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                              ]}
                            >
                              • {field}:
                            </Text>
                            <View style={styles.changeValues}>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.oldValue,
                                  { color: theme.colors.error },
                                ]}
                              >
                                {formatValue(field, change.anterior)}
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.arrow,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}
                              >
                                →
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.newValue,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                {formatValue(field, change.nuevo)}
                              </Text>
                            </View>
                          </View>
                        ),
                      )}
                    </View>
                  )}

                  {/* Información de entrega */}
                  {item.formattedChanges['Información de entrega'] && (
                    <View style={styles.sectionContainer}>
                      <Text
                        variant="labelMedium"
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.secondary },
                        ]}
                      >
                        🚚 Información de entrega:
                      </Text>
                      {Object.entries(item.formattedChanges['Información de entrega'] as Record<string, any>).map(
                        ([field, change]) => (
                          <View key={field} style={styles.changeRow}>
                            <Text
                              variant="labelSmall"
                              style={[
                                styles.fieldLabel,
                                { color: theme.colors.onSurfaceVariant, fontWeight: '500' },
                              ]}
                            >
                              • {field}:
                            </Text>
                            <View style={styles.changeValues}>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.oldValue,
                                  { color: theme.colors.error },
                                ]}
                              >
                                {formatValue(field, change.anterior)}
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.arrow,
                                  { color: theme.colors.onSurfaceVariant },
                                ]}
                              >
                                →
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.newValue,
                                  { color: theme.colors.primary },
                                ]}
                              >
                                {formatValue(field, change.nuevo)}
                              </Text>
                            </View>
                          </View>
                        ),
                      )}
                    </View>
                  )}

                  {/* Cambios en productos */}
                  {item.formattedChanges['Cambios en productos'] && (
                    <View style={styles.sectionContainer}>
                      <Text
                        variant="labelMedium"
                        style={[
                          styles.sectionTitle,
                          { color: theme.colors.tertiary },
                        ]}
                      >
                        🍕 Cambios en productos:
                      </Text>
                      {Object.entries(item.formattedChanges['Cambios en productos'] as Record<string, any>).map(
                        ([operationType, items]) => {
                          if (operationType === 'Productos agregados' && Array.isArray(items)) {
                            return (
                              <View key={operationType} style={styles.productSection}>
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.productOperationType,
                                    { color: theme.colors.primary },
                                  ]}
                                >
                                  ➕ {operationType}:
                                </Text>
                                {items.map((item: string, idx: number) => (
                                  <Text
                                    key={idx}
                                    variant="bodySmall"
                                    style={[
                                      styles.productItem,
                                      { color: theme.colors.onSurface },
                                    ]}
                                  >
                                    • {item}
                                  </Text>
                                ))}
                              </View>
                            );
                          }
                          if (operationType === 'Productos modificados' && Array.isArray(items)) {
                            return (
                              <View key={operationType} style={styles.productSection}>
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.productOperationType,
                                    { color: theme.colors.secondary },
                                  ]}
                                >
                                  ✏️ {operationType}:
                                </Text>
                                {items.map((item: string, idx: number) => (
                                  <Text
                                    key={idx}
                                    variant="bodySmall"
                                    style={[
                                      styles.productItem,
                                      { color: theme.colors.onSurface },
                                    ]}
                                  >
                                    • {item}
                                  </Text>
                                ))}
                              </View>
                            );
                          }
                          if (operationType === 'Productos eliminados' && Array.isArray(items)) {
                            return (
                              <View key={operationType} style={styles.productSection}>
                                <Text
                                  variant="labelSmall"
                                  style={[
                                    styles.productOperationType,
                                    { color: theme.colors.error },
                                  ]}
                                >
                                  ❌ {operationType}:
                                </Text>
                                {items.map((item: string, idx: number) => (
                                  <Text
                                    key={idx}
                                    variant="bodySmall"
                                    style={[
                                      styles.productItem,
                                      { color: theme.colors.onSurface },
                                    ]}
                                  >
                                    • {item}
                                  </Text>
                                ))}
                              </View>
                            );
                          }
                          return null;
                        },
                      )}
                    </View>
                  )}
                </>
              )}

              {item.operation === 'DELETE' && (
                <Text
                  variant="bodySmall"
                  style={[styles.summaryText, { color: theme.colors.error }]}
                >
                  Orden eliminada
                </Text>
              )}
            </View>
          )}

          {/* Contenido para items individuales */}
          {item.type === 'item' && (
            <View style={styles.changesContainer}>
              {item.operation === 'UPDATE' && item.formattedChanges && (
                <>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.summaryText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Cambios en el item:
                  </Text>
                  {Object.entries(item.formattedChanges).map(
                    ([field, change]) => (
                      <View key={field} style={styles.changeRow}>
                        <Text
                          variant="labelSmall"
                          style={[
                            styles.fieldLabel,
                            { color: theme.colors.onSurfaceVariant },
                          ]}
                        >
                          {formatFieldName(field)}:
                        </Text>
                        <ChangeDetailRenderer
                          change={change}
                          fieldName={field}
                          styles={styles}
                        />
                      </View>
                    ),
                  )}
                </>
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
            <BatchOperationsSection
              batchOperations={item.batchOperations}
              styles={styles}
            />
          )}
        </View>
      )}
    </Surface>
  );
};
