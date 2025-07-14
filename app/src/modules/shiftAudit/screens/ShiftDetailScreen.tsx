import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Divider,
  Surface,
  Chip,
  DataTable,
  Button,
  ActivityIndicator,
  Searchbar,
  SegmentedButtons,
  Avatar,
  Appbar,
} from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '@/app/styles/theme';
import { useShiftDetail } from '../hooks/useShifts';
import { useShiftOrders, useShiftSummary } from '../hooks/useShiftOrders';
import { formatCurrency } from '@/app/lib/formatters';
import { shiftService } from '../services/shiftService';
import type { ShiftDetailScreenRouteProp } from '../navigation/types';
import type { ShiftOrder } from '../types';

export function ShiftDetailScreen() {
  const theme = useAppTheme();
  const route = useRoute<ShiftDetailScreenRouteProp>();
  const navigation = useNavigation();
  const { shiftId } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const { data: shift, isLoading: isLoadingShift, error: shiftError } = useShiftDetail(shiftId);
  const { data: orders, isLoading: isLoadingOrders, error: ordersError } = useShiftOrders(shiftId);
  const { summary, isLoading: isLoadingSummary } = useShiftSummary(shiftId);

  const isLoading = isLoadingShift || isLoadingOrders || isLoadingSummary;
  const error = shiftError || ordersError;

  console.log('[ShiftDetailScreen] Shift:', shift);
  console.log('[ShiftDetailScreen] Orders:', orders);
  console.log('[ShiftDetailScreen] Summary:', summary);

  // Formatear órdenes de manera segura
  const formattedOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return [];
    try {
      return shiftService.formatOrdersForDetail(orders);
    } catch (e) {
      console.error('[ShiftDetailScreen] Error formatting orders:', e);
      return [];
    }
  }, [orders]);

  // Filtrar órdenes
  const filteredOrders = useMemo(() => {
    return formattedOrders.filter((order) => {
      const matchesSearch =
        !searchQuery ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(searchQuery.toLowerCase()),
        );

      const matchesFilter =
        selectedFilter === 'all' ||
        (selectedFilter === 'paid' && order.paymentMethod !== 'Sin pagar') ||
        (selectedFilter === 'unpaid' && order.paymentMethod === 'Sin pagar');

      return matchesSearch && matchesFilter;
    });
  }, [formattedOrders, searchQuery, selectedFilter]);

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Cargando información del turno...</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Avatar.Icon 
        icon="alert-circle-outline" 
        size={80} 
        style={{ backgroundColor: theme.colors.errorContainer }} 
        color={theme.colors.error}
      />
      <Text style={styles.errorText}>
        {error?.message || 'No se pudo cargar la información del turno'}
      </Text>
      <Button mode="contained" onPress={() => navigation.goBack()} style={styles.backButton}>
        Volver
      </Button>
    </View>
  );

  const renderShiftHeader = () => {
    if (!shift) return null;

    return (
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              Turno #{shift.globalShiftNumber || shift.shiftNumber || shift.id}
            </Text>
            <Chip
              mode="flat"
              icon={shift.status === 'open' ? 'lock-open' : 'lock'}
              style={[
                styles.statusChip,
                {
                  backgroundColor: shift.status === 'open'
                    ? theme.colors.primaryContainer
                    : theme.colors.surfaceVariant,
                },
              ]}
              textStyle={[
                styles.statusChipText,
                {
                  color: shift.status === 'open'
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurfaceVariant,
                },
              ]}
              compact
            >
              {shift.status === 'open' ? 'Abierto' : 'Cerrado'}
            </Chip>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerDate}>
              Abierto: {shift.openedAt ? formatDateTime(shift.openedAt) : 'N/A'}
            </Text>
            {shift.closedAt && (
              <Text style={styles.headerDate}>
                Cerrado: {formatDateTime(shift.closedAt)}
              </Text>
            )}
            <Text style={styles.headerUser}>
              Por: {shift.openedBy?.firstName || 'N/A'} {shift.openedBy?.lastName || ''}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderSummary = () => {
    if (!shift || !summary) return null;

    return (
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumen del Turno</Text>

        <View style={styles.statsGrid}>
          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statLabel}>Ventas Totales</Text>
            <Text style={styles.statValue}>
              {formatCurrency(summary.totalSales || shift.totalSales || 0)}
            </Text>
          </Surface>

          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statLabel}>Total Órdenes</Text>
            <Text style={styles.statValue}>
              {summary.ordersCount || shift.totalOrders || 0}
            </Text>
          </Surface>

          <Surface style={styles.statCard} elevation={1}>
            <Text style={styles.statLabel}>Ticket Promedio</Text>
            <Text style={styles.statValue}>
              {formatCurrency(
                (summary.totalSales || shift.totalSales || 0) / 
                (summary.ordersCount || shift.totalOrders || 1),
              )}
            </Text>
          </Surface>
        </View>

        {summary.paymentMethodsSummary && summary.paymentMethodsSummary.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Métodos de Pago</Text>
            <Card style={styles.summaryCard}>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Método</DataTable.Title>
                  <DataTable.Title numeric>Cantidad</DataTable.Title>
                  <DataTable.Title numeric>Total</DataTable.Title>
                </DataTable.Header>
                {summary.paymentMethodsSummary.map((payment, index) => (
                  <DataTable.Row key={`${payment.method}-${index}`}>
                    <DataTable.Cell>{payment.method}</DataTable.Cell>
                    <DataTable.Cell numeric>{payment.count}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {formatCurrency(payment.total)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card>
          </>
        )}

        {summary.productsSummary && summary.productsSummary.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Productos Más Vendidos</Text>
            <Card style={styles.summaryCard}>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Producto</DataTable.Title>
                  <DataTable.Title numeric>Cantidad</DataTable.Title>
                  <DataTable.Title numeric>Total</DataTable.Title>
                </DataTable.Header>
                {summary.productsSummary.slice(0, 10).map((product, index) => (
                  <DataTable.Row key={`${product.productName}-${index}`}>
                    <DataTable.Cell>{product.productName}</DataTable.Cell>
                    <DataTable.Cell numeric>{product.quantity}</DataTable.Cell>
                    <DataTable.Cell numeric>
                      {formatCurrency(product.total)}
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </Card>
          </>
        )}

        <View style={styles.cashSummary}>
          <Text style={styles.subsectionTitle}>Resumen de Efectivo</Text>
          <Card style={styles.cashCard}>
            <Card.Content>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Efectivo Inicial:</Text>
                <Text style={styles.cashValue}>
                  {formatCurrency(shift.initialCash)}
                </Text>
              </View>
              {shift.finalCash !== null && (
                <>
                  <Divider style={styles.cashDivider} />
                  <View style={styles.cashRow}>
                    <Text style={styles.cashLabel}>Efectivo Final:</Text>
                    <Text style={styles.cashValue}>
                      {formatCurrency(shift.finalCash)}
                    </Text>
                  </View>
                  <Divider style={styles.cashDivider} />
                  <View style={styles.cashRow}>
                    <Text style={[styles.cashLabel, styles.cashTotalLabel]}>
                      Diferencia:
                    </Text>
                    <Text
                      style={[
                        styles.cashValue,
                        styles.cashTotalValue,
                        {
                          color:
                            shift.finalCash - shift.initialCash >= 0
                              ? theme.colors.tertiary
                              : theme.colors.error,
                        },
                      ]}
                    >
                      {formatCurrency(shift.finalCash - shift.initialCash)}
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </View>
      </View>
    );
  };

  const renderOrderItem = ({ item: order }: { item: ShiftOrder }) => {
    const isExpanded = expandedOrderId === order.id;

    return (
      <Card
        style={styles.orderCard}
        onPress={() => setExpandedOrderId(isExpanded ? null : order.id)}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.orderHeader}>
            <View style={styles.orderTitleRow}>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.orderTotal}>
                {formatCurrency(order.total)}
              </Text>
            </View>
            <View style={styles.orderMetaRow}>
              <Text style={styles.orderMeta}>
                {order.createdAt ? format(parseISO(order.createdAt), 'HH:mm', { locale: es }) : 'N/A'}
              </Text>
              {order.customerName && (
                <Text style={styles.orderMeta}> • {order.customerName}</Text>
              )}
              <Chip
                mode="flat"
                style={[
                  styles.paymentChip,
                  {
                    backgroundColor:
                      order.paymentMethod === 'Sin pagar'
                        ? theme.colors.errorContainer
                        : theme.colors.tertiaryContainer,
                  },
                ]}
                textStyle={[
                  styles.paymentChipText,
                  {
                    color:
                      order.paymentMethod === 'Sin pagar'
                        ? theme.colors.onErrorContainer
                        : theme.colors.onTertiaryContainer,
                  },
                ]}
                compact
              >
                {order.paymentMethod}
              </Chip>
            </View>
          </View>

          {isExpanded && order.items.length > 0 && (
            <>
              <Divider style={styles.orderDivider} />
              <View style={styles.orderItems}>
                {order.items.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.orderItemRow}>
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName}>
                        {item.quantity}x {item.productName}
                      </Text>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <Text style={styles.orderItemModifiers}>
                          {item.modifiers.join(', ')}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.orderItemPrice}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    appbar: {
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    mainListContent: {
      paddingBottom: theme.spacing.l,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.l,
      padding: theme.spacing.xl,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    backButton: {
      marginTop: theme.spacing.m,
    },
    headerCard: {
      margin: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusChip: {
      marginLeft: theme.spacing.m,
    },
    statusChipText: {
      fontWeight: '600',
    },
    headerInfo: {
      gap: theme.spacing.xs,
    },
    headerDate: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    headerUser: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    summarySection: {
      padding: theme.spacing.m,
      gap: theme.spacing.m,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.s,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: theme.spacing.m,
      marginBottom: theme.spacing.l,
    },
    statCard: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.primaryContainer,
    },
    statLabel: {
      fontSize: 12,
      color: theme.colors.onPrimaryContainer,
      marginBottom: theme.spacing.xs,
      opacity: 0.8,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.onPrimaryContainer,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    summaryCard: {
      backgroundColor: theme.colors.surface,
    },
    cashSummary: {
      marginTop: theme.spacing.l,
    },
    cashCard: {
      backgroundColor: theme.colors.surface,
    },
    cashRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
    },
    cashLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    cashValue: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    cashDivider: {
      marginVertical: theme.spacing.xs,
    },
    cashTotalLabel: {
      fontWeight: '600',
      fontSize: 16,
    },
    cashTotalValue: {
      fontWeight: '700',
      fontSize: 18,
    },
    ordersSectionHeader: {
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      gap: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    searchbar: {
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    filterButtons: {
      marginHorizontal: 0,
    },
    orderCard: {
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.background,
    },
    orderHeader: {
      gap: theme.spacing.xs,
    },
    orderTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    orderTotal: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    orderMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    orderMeta: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    paymentChip: {
      marginLeft: 'auto',
    },
    paymentChipText: {
      fontSize: 12,
      fontWeight: '500',
    },
    orderDivider: {
      marginVertical: theme.spacing.m,
    },
    orderItems: {
      gap: theme.spacing.s,
    },
    orderItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderItemInfo: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    orderItemName: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    orderItemModifiers: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    orderItemPrice: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    emptyOrdersContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl * 2,
      gap: theme.spacing.m,
    },
    emptyOrdersText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
  });

  // Renderizado principal
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Cargando turno..." />
        </Appbar.Header>
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (error || !shift) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Appbar.Header style={styles.appbar}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Error" />
        </Appbar.Header>
        {renderError()}
      </SafeAreaView>
    );
  }

  // Renderizar las secciones del header como un componente
  const ListHeaderComponent = () => (
    <>
      {renderShiftHeader()}
      {renderSummary()}
      <View style={styles.ordersSectionHeader}>
        <Text style={styles.sectionTitle}>Órdenes del Turno</Text>

        <Searchbar
          placeholder="Buscar por número, cliente o producto..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          elevation={0}
        />

        <SegmentedButtons
          value={selectedFilter}
          onValueChange={setSelectedFilter}
          buttons={[
            { value: 'all', label: 'Todas' },
            { value: 'paid', label: 'Pagadas' },
            { value: 'unpaid', label: 'Sin pagar' },
          ]}
          style={styles.filterButtons}
        />
      </View>
    </>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyOrdersContainer}>
      <Avatar.Icon 
        icon="receipt-text-outline" 
        size={60} 
        style={{ backgroundColor: theme.colors.surfaceVariant }} 
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyOrdersText}>No hay órdenes en este turno</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content 
          title={`Turno #${shift?.globalShiftNumber || shift?.shiftNumber || ''}`}
          subtitle={shift?.status === 'open' ? 'Turno abierto' : 'Turno cerrado'}
        />
      </Appbar.Header>
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.mainListContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}