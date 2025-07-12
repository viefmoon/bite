import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Chip, Card, Divider, Surface, Searchbar, SegmentedButtons, Button, Menu, IconButton } from 'react-native-paper';
import { useDrawerStatus } from '@react-navigation/drawer';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth, startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import GenericList from '@/app/components/crud/GenericList';
import { useListState } from '@/app/hooks/useListState';
import { useAppTheme } from '@/app/styles/theme';
import { useShifts, useCurrentShift } from '../hooks/useShifts';
import { formatCurrency } from '@/app/lib/formatters';
import type { Shift } from '../types';
import type { ShiftAuditStackNavigationProp } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';

export function ShiftsListScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<ShiftAuditStackNavigationProp>();
  const drawerStatus = useDrawerStatus();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const limit = 30;
  const offset = 0;

  const { data: shifts, isLoading, error, refetch } = useShifts(limit, offset);
  const { data: currentShift } = useCurrentShift();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Filtrar turnos según los criterios seleccionados
  const filteredShifts = useMemo(() => {
    if (!shifts) return [];

    return shifts.filter((shift) => {
      // Filtro por búsqueda
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          shift.id.toString().includes(searchLower) ||
          shift.openedBy?.firstName?.toLowerCase().includes(searchLower) ||
          shift.openedBy?.lastName?.toLowerCase().includes(searchLower) ||
          shift.closedBy?.firstName?.toLowerCase().includes(searchLower) ||
          shift.closedBy?.lastName?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtro por estado
      if (statusFilter !== 'all') {
        const isOpen = !shift.closedAt;
        if (statusFilter === 'open' && !isOpen) return false;
        if (statusFilter === 'closed' && isOpen) return false;
      }

      // Filtro por fecha
      if (dateFilter !== 'all') {
        const shiftDate = parseISO(shift.openedAt);
        const now = new Date();

        switch (dateFilter) {
          case 'today':
            if (!isToday(shiftDate)) return false;
            break;
          case 'yesterday':
            if (!isYesterday(shiftDate)) return false;
            break;
          case 'week':
            if (!isThisWeek(shiftDate, { locale: es })) return false;
            break;
          case 'month':
            if (!isThisMonth(shiftDate)) return false;
            break;
        }
      }

      return true;
    });
  }, [shifts, searchQuery, dateFilter, statusFilter]);

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Hoy';
      case 'yesterday': return 'Ayer';
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      default: return 'Todo el tiempo';
    }
  };

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError: !!error,
    data: filteredShifts,
    emptyConfig: {
      title: searchQuery || dateFilter !== 'all' || statusFilter !== 'all' 
        ? 'No se encontraron turnos' 
        : 'No hay turnos registrados',
      message: searchQuery || dateFilter !== 'all' || statusFilter !== 'all'
        ? 'Prueba ajustando los filtros de búsqueda'
        : 'Aún no se han cerrado turnos para auditar',
      icon: 'history',
    },
    errorConfig: {
      title: 'Error al cargar turnos',
      message: 'No se pudieron cargar los turnos. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetch,
    },
  });

  const handleShiftPress = (shift: Shift) => {
    navigation.navigate('ShiftDetail', { shiftId: shift.id });
  };

  const formatShiftDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatShiftTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'HH:mm', { locale: es });
    } catch {
      return dateString;
    }
  };

  const getShiftDuration = (openedAt: string, closedAt: string | null) => {
    if (!closedAt) return 'En curso';
    try {
      const start = parseISO(openedAt);
      const end = parseISO(closedAt);
      const diffInMinutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60),
      );
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch {
      return 'N/A';
    }
  };

  const renderShiftItem = (shift: Shift) => {
    const isOpen = !shift.closedAt;
    const isCurrent = currentShift?.id === shift.id;

    return (
      <Card
        style={[
          styles.shiftCard,
          isOpen && styles.openShiftCard,
          isCurrent && { borderColor: theme.colors.primary, borderWidth: 2 },
        ]}
        onPress={() => handleShiftPress(shift)}
        mode="contained"
      >
        <Card.Content>
          <View style={styles.shiftHeader}>
            <View style={styles.shiftTitleRow}>
              <Text style={styles.shiftNumber}>Turno #{shift.id}</Text>
              {isCurrent && (
                <Chip
                  mode="flat"
                  icon="cash-register"
                  style={styles.currentChip}
                  textStyle={styles.currentChipText}
                  compact
                >
                  Actual
                </Chip>
              )}
              <Chip
                mode="flat"
                icon={isOpen ? 'lock-open' : 'lock'}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isOpen
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceVariant,
                  },
                ]}
                textStyle={[
                  styles.statusChipText,
                  {
                    color: isOpen
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
                compact
              >
                {isOpen ? 'Abierto' : 'Cerrado'}
              </Chip>
            </View>
            <Text style={styles.shiftDate}>
              {formatShiftDate(shift.openedAt)}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.shiftDetails}>
            <View style={styles.timeSection}>
              <Text style={styles.label}>Horario</Text>
              <Text style={styles.timeText}>
                {formatShiftTime(shift.openedAt)} -{' '}
                {shift.closedAt ? formatShiftTime(shift.closedAt) : 'En curso'}
              </Text>
              <Text style={styles.durationText}>
                Duración: {getShiftDuration(shift.openedAt, shift.closedAt)}
              </Text>
            </View>

            <View style={styles.statsSection}>
              <Surface style={styles.statCard} elevation={0}>
                <Icon source="currency-usd" size={20} color={theme.colors.primary} />
                <Text style={styles.statLabel}>Ventas</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(shift.totalSales || 0)}
                </Text>
              </Surface>
              <Surface style={styles.statCard} elevation={0}>
                <Icon source="receipt" size={20} color={theme.colors.secondary} />
                <Text style={styles.statLabel}>Órdenes</Text>
                <Text style={styles.statValue}>{shift.totalOrders || 0}</Text>
              </Surface>
              {shift.totalOrders > 0 && (
                <Surface style={styles.statCard} elevation={0}>
                  <Icon source="calculator" size={20} color={theme.colors.tertiary} />
                  <Text style={styles.statLabel}>Promedio</Text>
                  <Text style={styles.statValue}>
                    {formatCurrency((shift.totalSales || 0) / shift.totalOrders)}
                  </Text>
                </Surface>
              )}
            </View>

            <View style={styles.cashSection}>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Efectivo Inicial:</Text>
                <Text style={styles.cashValue}>
                  {formatCurrency(shift.initialCash)}
                </Text>
              </View>
              {shift.finalCash !== null && (
                <>
                  <View style={styles.cashRow}>
                    <Text style={styles.cashLabel}>Efectivo Final:</Text>
                    <Text style={styles.cashValue}>
                      {formatCurrency(shift.finalCash)}
                    </Text>
                  </View>
                  <View style={styles.cashRow}>
                    <Text style={[styles.cashLabel, styles.differenceLabel]}>
                      Diferencia:
                    </Text>
                    <Text
                      style={[
                        styles.cashValue,
                        styles.differenceValue,
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
            </View>

            <View style={styles.userSection}>
              <Text style={styles.userText}>
                Abierto por: {shift.openedBy?.firstName || ''}{' '}
                {shift.openedBy?.lastName || ''}
              </Text>
              {shift.closedBy && (
                <Text style={styles.userText}>
                  Cerrado por: {shift.closedBy.firstName || ''}{' '}
                  {shift.closedBy.lastName || ''}
                </Text>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderFilters = () => (
    <Surface style={styles.filterContainer} elevation={0}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        {/* Filtro de fecha */}
        <Menu
          visible={showDateMenu}
          onDismiss={() => setShowDateMenu(false)}
          anchor={
            <Chip
              mode="outlined"
              icon="calendar"
              onPress={() => setShowDateMenu(true)}
              selected={dateFilter !== 'all'}
              style={[styles.filterChip, dateFilter !== 'all' && styles.filterChipSelected]}
              textStyle={styles.filterChipText}
            >
              {getDateFilterLabel()}
            </Chip>
          }
        >
          <Menu.Item onPress={() => { setDateFilter('all'); setShowDateMenu(false); }} title="Todo el tiempo" />
          <Menu.Item onPress={() => { setDateFilter('today'); setShowDateMenu(false); }} title="Hoy" />
          <Menu.Item onPress={() => { setDateFilter('yesterday'); setShowDateMenu(false); }} title="Ayer" />
          <Menu.Item onPress={() => { setDateFilter('week'); setShowDateMenu(false); }} title="Esta semana" />
          <Menu.Item onPress={() => { setDateFilter('month'); setShowDateMenu(false); }} title="Este mes" />
        </Menu>

        {/* Filtro de estado */}
        <Chip
          mode="outlined"
          icon={statusFilter === 'open' ? 'lock-open' : statusFilter === 'closed' ? 'lock' : 'filter'}
          onPress={() => {
            if (statusFilter === 'all') setStatusFilter('open');
            else if (statusFilter === 'open') setStatusFilter('closed');
            else setStatusFilter('all');
          }}
          selected={statusFilter !== 'all'}
          style={[styles.filterChip, statusFilter !== 'all' && styles.filterChipSelected]}
          textStyle={styles.filterChipText}
        >
          {statusFilter === 'all' ? 'Todos' : statusFilter === 'open' ? 'Abiertos' : 'Cerrados'}
        </Chip>

        {/* Limpiar filtros */}
        {(dateFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
          <Chip
            mode="flat"
            icon="close"
            onPress={() => {
              setDateFilter('all');
              setStatusFilter('all');
              setSearchQuery('');
            }}
            style={styles.clearChip}
            textStyle={styles.clearChipText}
          >
            Limpiar
          </Chip>
        )}
      </ScrollView>
    </Surface>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    filterContainer: {
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.surfaceVariant,
    },
    filterScrollContent: {
      paddingHorizontal: theme.spacing.m,
      gap: theme.spacing.s,
      alignItems: 'center',
    },
    filterChip: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.outline,
    },
    filterChipSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    },
    filterChipText: {
      fontSize: 14,
    },
    clearChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    clearChipText: {
      color: theme.colors.onErrorContainer,
      fontSize: 14,
    },
    searchContainer: {
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    searchbar: {
      elevation: 0,
      backgroundColor: theme.colors.surfaceVariant,
    },
    shiftCard: {
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.s,
      backgroundColor: theme.colors.surface,
    },
    openShiftCard: {
      backgroundColor: theme.colors.primaryContainer,
    },
    shiftHeader: {
      marginBottom: theme.spacing.m,
    },
    shiftTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.xs,
    },
    shiftNumber: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    shiftDate: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    currentChip: {
      backgroundColor: theme.colors.tertiaryContainer,
    },
    currentChipText: {
      color: theme.colors.onTertiaryContainer,
      fontWeight: '600',
    },
    statusChip: {
      marginLeft: 'auto',
    },
    statusChipText: {
      fontWeight: '600',
    },
    divider: {
      marginVertical: theme.spacing.m,
    },
    shiftDetails: {
      gap: theme.spacing.m,
    },
    timeSection: {
      gap: theme.spacing.xs,
    },
    label: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    timeText: {
      fontSize: 16,
      color: theme.colors.onSurface,
    },
    durationText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    statsSection: {
      flexDirection: 'row',
      gap: theme.spacing.m,
    },
    statCard: {
      flex: 1,
      padding: theme.spacing.m,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    cashSection: {
      gap: theme.spacing.xs,
      padding: theme.spacing.m,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    cashRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    differenceLabel: {
      fontWeight: '600',
    },
    differenceValue: {
      fontWeight: '600',
    },
    userSection: {
      gap: theme.spacing.xs,
    },
    userText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.container}>
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar por número de turno o empleado..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={0}
            icon="magnify"
          />
        </View>

        {/* Filtros */}
        {renderFilters()}

        {/* Lista de turnos */}
        <GenericList
          items={filteredShifts}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onItemPress={handleShiftPress}
          ListEmptyComponent={ListEmptyComponent}
          renderConfig={{
            renderItem: renderShiftItem,
          }}
          showFab={false}
          isDrawerOpen={drawerStatus === 'open'}
        />
      </View>
    </SafeAreaView>
  );
}
