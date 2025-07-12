import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
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
} from 'react-native-paper';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRoute, useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
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
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  const { data: shift, isLoading: isLoadingShift } = useShiftDetail(shiftId);
  const { data: orders, isLoading: isLoadingOrders } = useShiftOrders(shiftId);
  const { summary, isLoading: isLoadingSummary } = useShiftSummary(shiftId);

  const isLoading = isLoadingShift || isLoadingOrders || isLoadingSummary;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Cargando información del turno...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!shift || !orders) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar la información del turno
          </Text>
          <Button mode="contained" onPress={() => navigation.goBack()}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const formattedOrders = shiftService.formatOrdersForDetail(orders);

  const filteredOrders = formattedOrders.filter((order) => {
    const matchesSearch =
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

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
    } catch {
      return dateString;
    }
  };

  const renderShiftHeader = () => (
    <Card style={styles.headerCard}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Turno #{shift.id}</Text>
          <Chip
            mode="flat"
            icon={shift.closedAt ? 'lock' : 'lock-open'}
            style={[
              styles.statusChip,
              {
                backgroundColor: shift.closedAt
                  ? theme.colors.surfaceVariant
                  : theme.colors.primaryContainer,
              },
            ]}
            textStyle={[
              styles.statusChipText,
              {
                color: shift.closedAt
                  ? theme.colors.onSurfaceVariant
                  : theme.colors.onPrimaryContainer,
              },
            ]}
            compact
          >
            {shift.closedAt ? 'Cerrado' : 'Abierto'}
          </Chip>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerDate}>
            Abierto: {formatDateTime(shift.openedAt)}
          </Text>
          {shift.closedAt && (
            <Text style={styles.headerDate}>
              Cerrado: {formatDateTime(shift.closedAt)}
            </Text>
          )}
          <Text style={styles.headerUser}>
            Por: {shift.openedBy?.firstName} {shift.openedBy?.lastName}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  const renderSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>Resumen del Turno</Text>

      <View style={styles.statsGrid}>
        <Surface style={styles.statCard} elevation={1}>
          <Text style={styles.statLabel}>Ventas Totales</Text>
          <Text style={styles.statValue}>
            {formatCurrency(summary?.totalSales || 0)}
          </Text>
        </Surface>

        <Surface style={styles.statCard} elevation={1}>
          <Text style={styles.statLabel}>Total Órdenes</Text>
          <Text style={styles.statValue}>{summary?.ordersCount || 0}</Text>
        </Surface>

        <Surface style={styles.statCard} elevation={1}>
          <Text style={styles.statLabel}>Ticket Promedio</Text>
          <Text style={styles.statValue}>
            {formatCurrency(
              (summary?.totalSales || 0) / (summary?.ordersCount || 1),
            )}
          </Text>
        </Surface>
      </View>

      {summary?.paymentMethodsSummary &&
        summary.paymentMethodsSummary.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Métodos de Pago</Text>
            <Card style={styles.summaryCard}>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title>Método</DataTable.Title>
                  <DataTable.Title numeric>Cantidad</DataTable.Title>
                  <DataTable.Title numeric>Total</DataTable.Title>
                </DataTable.Header>
                {summary.paymentMethodsSummary.map((payment) => (
                  <DataTable.Row key={payment.method}>
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

      {summary?.productsSummary && summary.productsSummary.length > 0 && (
        <>
          <Text style={styles.subsectionTitle}>Productos Más Vendidos</Text>
          <Card style={styles.summaryCard}>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Producto</DataTable.Title>
                <DataTable.Title numeric>Cantidad</DataTable.Title>
                <DataTable.Title numeric>Total</DataTable.Title>
              </DataTable.Header>
              {summary.productsSummary.map((product, index) => (
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
                {format(parseISO(order.createdAt), 'HH:mm', { locale: es })}
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

          {isExpanded && (
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    loadingText: {
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.l,
      padding: theme.spacing.l,
    },
    errorText: {
      fontSize: 16,
      color: theme.colors.error,
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
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
    ordersSection: {
      flex: 1,
    },
    ordersSectionHeader: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      gap: theme.spacing.m,
    },
    searchbar: {
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    filterButtons: {
      marginHorizontal: 0,
    },
    ordersList: {
      flex: 1,
    },
    ordersListContent: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    orderCard: {
      marginBottom: theme.spacing.m,
      backgroundColor: theme.colors.surface,
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
      fontWeight: '600',
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
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: theme.spacing.l }}
      >
        {renderShiftHeader()}
        {renderSummary()}

        <View style={styles.ordersSection}>
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

          <View style={styles.ordersList}>
            <FlashList
              data={filteredOrders}
              renderItem={renderOrderItem}
              estimatedItemSize={100}
              contentContainerStyle={styles.ordersListContent}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
