import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  Text,
  IconButton,
  Surface,
  Chip,
  Avatar,
  Button,
} from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';

interface OrderHistoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId: string | null;
  orderNumber?: number;
}

interface HistoryItemData {
  id: string | number;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  changedBy: string;
  changedAt: string;
  formattedChanges?: Record<string, any>;
  snapshot?: Record<string, any>;
  changedByUser?: {
    firstName: string;
    lastName: string;
  };
}

const HistoryItemCard: React.FC<{
  item: HistoryItemData;
  theme: any;
}> = ({ item, theme }) => {
  const [expanded, setExpanded] = useState(false);

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'plus-circle';
      case 'UPDATE':
        return 'pencil-circle';
      case 'DELETE':
        return 'delete-circle';
      default:
        return 'help-circle';
    }
  };

  const getOperationLabel = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return 'Creada';
      case 'UPDATE':
        return 'Modificada';
      case 'DELETE':
        return 'Eliminada';
      default:
        return operation;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'INSERT':
        return theme.colors.primary;
      case 'UPDATE':
        return theme.colors.secondary;
      case 'DELETE':
        return theme.colors.error;
      default:
        return theme.colors.onSurface;
    }
  };

  const getUserDisplayName = () => {
    if (item.changedByUser?.firstName && item.changedByUser?.lastName) {
      return `${item.changedByUser.firstName} ${item.changedByUser.lastName}`;
    }
    return 'Usuario no especificado';
  };

  const renderChangeValue = (change: any) => {
    if (change.type === 'added') {
      return (
        <View style={styles.changeValues}>
          <Text style={[styles.newValue, { color: theme.colors.primary }]}>
            {change.value}
          </Text>
        </View>
      );
    } else if (change.type === 'removed') {
      return (
        <View style={styles.changeValues}>
          <Text
            style={[
              styles.oldValue,
              { color: theme.colors.error, textDecorationLine: 'line-through' },
            ]}
          >
            {change.value} (removido)
          </Text>
        </View>
      );
    } else if (change.type === 'changed') {
      return (
        <View style={styles.changeValues}>
          <Text style={[styles.oldValue, { color: theme.colors.error }]}>
            {change.anterior}
          </Text>
          <Text
            style={[styles.arrow, { color: theme.colors.onSurfaceVariant }]}
          >
            →
          </Text>
          <Text style={[styles.newValue, { color: theme.colors.primary }]}>
            {change.nuevo}
          </Text>
        </View>
      );
    } else {
      // Fallback para formato anterior
      return (
        <View style={styles.changeValues}>
          <Text style={[styles.oldValue, { color: theme.colors.error }]}>
            {change.anterior || 'No especificado'}
          </Text>
          <Text
            style={[styles.arrow, { color: theme.colors.onSurfaceVariant }]}
          >
            →
          </Text>
          <Text style={[styles.newValue, { color: theme.colors.primary }]}>
            {change.nuevo || 'No especificado'}
          </Text>
        </View>
      );
    }
  };

  const renderChangeDetails = () => {
    if (!item.formattedChanges || !expanded) return null;

    return (
      <View
        style={[
          styles.expandedContent,
          { borderTopColor: theme.colors.outlineVariant },
        ]}
      >
        {/* Cambios en la orden */}
        {item.formattedChanges['Cambios en la orden'] && (
          <View
            style={[
              styles.sectionContainer,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              🏷️ Cambios en la orden:
            </Text>
            {Object.entries(
              item.formattedChanges['Cambios en la orden'] as Record<
                string,
                any
              >,
            ).map(([field, change]) => (
              <View key={field} style={styles.changeRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  • {field}:
                </Text>
                {renderChangeValue(change)}
              </View>
            ))}
          </View>
        )}

        {/* Información de entrega */}
        {item.formattedChanges['Información de entrega'] && (
          <View
            style={[
              styles.sectionContainer,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              🚚 Información de entrega:
            </Text>
            {Object.entries(
              item.formattedChanges['Información de entrega'] as Record<
                string,
                any
              >,
            ).map(([field, change]) => (
              <View key={field} style={styles.changeRow}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  • {field}:
                </Text>
                {renderChangeValue(change)}
              </View>
            ))}
          </View>
        )}

        {/* Cambios en productos */}
        {item.formattedChanges['Cambios en productos'] && (
          <View
            style={[
              styles.sectionContainer,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
          >
            <Text
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              🍕 Cambios en productos:
            </Text>
            {Object.entries(
              item.formattedChanges['Cambios en productos'] as Record<
                string,
                any
              >,
            ).map(([operationType, items]) => {
              if (Array.isArray(items)) {
                return (
                  <View key={operationType} style={styles.productSection}>
                    <Text
                      style={[
                        styles.productOperationType,
                        { color: theme.colors.primary },
                      ]}
                    >
                      {operationType}:
                    </Text>
                    {items.map((item: any, idx: number) => (
                      <View key={idx} style={styles.productItemContainer}>
                        {typeof item === 'string' ? (
                          <Text
                            style={[
                              styles.productItem,
                              { color: theme.colors.onSurface },
                            ]}
                          >
                            • {item}
                          </Text>
                        ) : (
                          <View style={styles.productChangeContainer}>
                            <Text
                              style={[
                                styles.productChangeLabel,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              • Antes:
                            </Text>
                            <Text
                              style={[
                                styles.productChangeValue,
                                { color: theme.colors.error },
                              ]}
                            >
                              {item.antes}
                            </Text>
                            <Text
                              style={[
                                styles.productChangeLabel,
                                { color: theme.colors.onSurfaceVariant },
                              ]}
                            >
                              Después:
                            </Text>
                            <Text
                              style={[
                                styles.productChangeValue,
                                { color: theme.colors.primary },
                              ]}
                            >
                              {item.después}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <Surface
      style={[styles.historyItem, { backgroundColor: theme.colors.surface }]}
      elevation={1}
    >
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemLeft}>
          <Avatar.Icon
            size={40}
            icon={getOperationIcon(item.operation)}
            style={[
              styles.operationIcon,
              { backgroundColor: getOperationColor(item.operation) + '20' },
            ]}
            theme={{
              colors: {
                onSurface: getOperationColor(item.operation),
              },
            }}
          />
          <View style={styles.historyItemInfo}>
            <Chip
              mode="flat"
              style={[
                styles.operationChip,
                { backgroundColor: getOperationColor(item.operation) + '20' },
              ]}
              textStyle={[
                styles.operationChipText,
                { color: getOperationColor(item.operation) },
              ]}
              compact
            >
              {getOperationLabel(item.operation)}
            </Chip>
            <Text
              style={[
                styles.userText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {getUserDisplayName()}
            </Text>
          </View>
        </View>
        <View style={styles.historyItemRight}>
          <Text
            style={[
              styles.timestampText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {format(new Date(item.changedAt), 'dd/MM/yyyy HH:mm', {
              locale: es,
            })}
          </Text>
          <IconButton
            icon={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            style={styles.expandButton}
            onPress={() => setExpanded(!expanded)}
          />
        </View>
      </View>
      {renderChangeDetails()}
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

  // Query para obtener el historial de la orden
  const {
    data: historyData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['orderHistory', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('No order ID');
      const url = `${API_PATHS.ORDERS_HISTORY.replace(':orderId', orderId)}?page=1&limit=100`;
      const response = await apiClient.get(url);
      return response.data?.data || [];
    },
    enabled: visible && !!orderId,
    staleTime: 0, // Los datos siempre se consideran obsoletos
    cacheTime: 0, // No mantener en caché
    refetchOnMount: true, // Refetch cuando el componente se monta
    refetchOnWindowFocus: false, // No refetch cuando la ventana obtiene focus
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.centeredText, { color: theme.colors.onSurface }]}
          >
            Cargando historial...
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            Error al cargar el historial de la orden
          </Text>
          <Button
            onPress={() => refetch()}
            mode="contained"
            style={styles.retryButton}
          >
            Reintentar
          </Button>
        </View>
      );
    }

    if (!historyData || historyData.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text
            style={[
              styles.centeredText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            No hay historial disponible para esta orden
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        {/* Subtitle con contador */}
        <View
          style={[
            styles.subtitleContainer,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <Text
            style={[
              styles.subtitleText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {historyData.length} cambios registrados
          </Text>
        </View>

        {/* Lista de cambios */}
        <View style={styles.historyList}>
          {historyData.map((item: HistoryItemData) => (
            <HistoryItemCard key={item.id} item={item} theme={theme} />
          ))}
        </View>
      </View>
    );
  };

  if (!orderId) {
    return null;
  }

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title={`Historial de Orden #${orderNumber || ''}`}
      maxWidthPercent={96}
      maxHeightPercent={94}
      noPadding={true}
    >
      {renderContent()}
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  // Contenedores principales
  historyContainer: {
    flex: 1,
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  subtitleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyList: {
    flex: 1,
    padding: 16,
  },

  // Estados centralizados
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  centeredText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },

  // Cards de historial
  historyItem: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  operationIcon: {
    marginRight: 12,
  },
  historyItemInfo: {
    flex: 1,
  },
  operationChip: {
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  operationChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  userText: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '500',
  },
  timestampText: {
    fontSize: 11,
    marginRight: 8,
    fontWeight: '400',
  },
  expandButton: {
    margin: 0,
  },

  // Contenido expandido
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  sectionContainer: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  changeRow: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  changeValues: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    flexWrap: 'wrap',
  },
  oldValue: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    opacity: 0.7,
    fontWeight: '400',
  },
  arrow: {
    fontSize: 14,
    marginHorizontal: 8,
    fontWeight: '700',
  },
  newValue: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Productos
  productSection: {
    marginLeft: 12,
    marginBottom: 12,
  },
  productOperationType: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  productItem: {
    fontSize: 13,
    paddingLeft: 12,
    paddingVertical: 4,
    lineHeight: 18,
  },
  productItemContainer: {
    marginBottom: 8,
  },
  productChangeContainer: {
    paddingLeft: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 8,
    marginVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0, 0, 0, 0.15)',
  },
  productChangeLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productChangeValue: {
    fontSize: 13,
    marginBottom: 8,
    paddingLeft: 8,
    lineHeight: 18,
  },
});

export default OrderHistoryModal;
