import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Divider, Chip, Avatar, Surface } from 'react-native-paper';
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
  formatFieldName
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
  theme 
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
                          {safeStringify(item.diff.summary)}
                        </Text>
                      )}

                      {/* Información de la orden */}
                      {item.diff.order && (
                        <OrderDetailsSection
                          orderDiff={item.diff.order}
                          snapshot={item.snapshot}
                          styles={styles}
                        />
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
                            {item.diff.items.added.map((addedItem, idx) => (
                              <ProductItemRenderer
                                key={`added-${idx}`}
                                item={addedItem}
                                index={idx}
                                type="added"
                                styles={styles}
                              />
                            ))}
                          </>
                        )}
                    </>
                  ) : (
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.summaryText,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Orden creada
                    </Text>
                  )}
                </>
              )}

              {/* Renderizado de otros tipos de operaciones para órdenes */}
              {item.operation === 'UPDATE' && item.formattedChanges && (
                <>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.summaryText,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Cambios realizados en la orden:
                  </Text>
                  {Object.entries(item.formattedChanges).map(([field, change]) => (
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
                  ))}
                </>
              )}

              {item.operation === 'DELETE' && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.summaryText,
                    { color: theme.colors.error },
                  ]}
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
                  {Object.entries(item.formattedChanges).map(([field, change]) => (
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
                  ))}
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