import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Chip,
  Card,
  Divider,
  Surface,
  Button,
  Menu,
  Avatar,
  ActivityIndicator,
  IconButton,
} from 'react-native-paper';
import { FlashList } from '@shopify/flash-list';
import {
  format,
  parseISO,
  isToday,
  isYesterday,
  subDays,
  isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from '@/app/styles/theme';
import { useShifts } from '../hooks/useShifts';
import { formatCurrency } from '@/app/lib/formatters';
import type { Shift } from '../types';
import type { ShiftAuditStackNavigationProp } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { useRefreshModuleOnFocus } from '@/app/hooks/useRefreshOnFocus';
import DateTimePicker from '@react-native-community/datetimepicker';

export function ShiftsListScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation<ShiftAuditStackNavigationProp>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState<
    'today' | 'yesterday' | 'last7' | 'custom'
  >('last7');
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date;
    end: Date;
  }>({
    start: subDays(new Date(), 7),
    end: new Date(),
  });
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>(
    'start',
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const limit = 30;
  const offset = 0;

  const { data: shifts, isLoading, error, refetch } = useShifts(limit, offset);

  useRefreshModuleOnFocus('shifts');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const filteredShifts = useMemo(() => {
    if (!shifts || !Array.isArray(shifts)) {
      return [];
    }

    const filtered = shifts.filter((shift) => {
      // Filtro por fecha
      if (shift.openedAt) {
        try {
          const shiftDate = parseISO(shift.openedAt);
          const now = new Date();

          switch (dateFilter) {
            case 'today': {
              if (!isToday(shiftDate)) return false;
              break;
            }
            case 'yesterday': {
              if (!isYesterday(shiftDate)) return false;
              break;
            }
            case 'last7': {
              const sevenDaysAgo = subDays(now, 7);
              if (shiftDate < sevenDaysAgo) return false;
              break;
            }
            case 'custom': {
              if (
                !isWithinInterval(shiftDate, {
                  start: customDateRange.start,
                  end: customDateRange.end,
                })
              ) {
                return false;
              }
              break;
            }
          }
        } catch (e) {
          return false;
        }
      }

      return true;
    });

    return filtered;
  }, [shifts, dateFilter, customDateRange]);

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Hoy';
      case 'yesterday':
        return 'Ayer';
      case 'last7':
        return 'Últimos 7 días';
      case 'custom':
        return `${format(customDateRange.start, 'dd/MM')} - ${format(customDateRange.end, 'dd/MM')}`;
      default:
        return 'Últimos 7 días';
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setCustomDateRange({ ...customDateRange, start: selectedDate });
      } else {
        setCustomDateRange({ ...customDateRange, end: selectedDate });
      }
    }
  };

  const handleCustomDateRange = () => {
    setDateFilter('custom');
    setShowDateMenu(false);
    setShowDateRangePicker(true);
  };

  const handleShiftPress = (shift: Shift) => {
    navigation.navigate('ShiftDetail', { shiftId: String(shift.id) });
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

  const renderShiftItem = ({ item: shift }: { item: Shift }) => {
    const isOpen = shift.status === 'open';
    const isCurrent = false;

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
              <Text style={styles.shiftNumber}>
                Turno #{shift.globalShiftNumber || shift.shiftNumber || 'N/A'}
              </Text>
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
              {shift.openedAt
                ? formatShiftDate(shift.openedAt)
                : 'Fecha no disponible'}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.shiftDetails}>
            {/* Sección de tiempo y estadísticas en una sola línea */}
            <View style={styles.timeSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeText}>
                  {shift.openedAt ? formatShiftTime(shift.openedAt) : 'N/A'} -{' '}
                  {shift.closedAt
                    ? formatShiftTime(shift.closedAt)
                    : 'En curso'}
                </Text>
                <Text style={styles.durationText}>
                  {shift.openedAt
                    ? getShiftDuration(shift.openedAt, shift.closedAt)
                    : 'N/A'}
                </Text>
              </View>
            </View>

            {/* Estadísticas más compactas */}
            <View style={styles.statsSection}>
              <Surface style={styles.statCard} elevation={0}>
                <Text style={styles.statLabel}>VENTAS</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(shift.totalSales)}
                </Text>
              </Surface>

              <Surface style={styles.statCard} elevation={0}>
                <Text style={styles.statLabel}>ÓRDENES</Text>
                <Text style={styles.statValue}>{shift.totalOrders || 0}</Text>
              </Surface>
            </View>

            {/* Sección de efectivo más compacta */}
            <View style={styles.cashSection}>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Inicial</Text>
                <Text style={styles.cashValue}>
                  {formatCurrency(shift.initialCash)}
                </Text>
              </View>
              {shift.finalCash !== null && (
                <>
                  <View style={styles.cashRow}>
                    <Text style={styles.cashLabel}>Final</Text>
                    <Text style={styles.cashValue}>
                      {formatCurrency(shift.finalCash)}
                    </Text>
                  </View>
                  <View style={styles.cashRow}>
                    <Text style={[styles.cashLabel, styles.differenceLabel]}>
                      Diferencia
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

            {/* Usuarios en una línea */}
            <View style={styles.userSection}>
              <Text style={styles.userText}>
                👤 {shift.openedBy?.firstName || 'N/A'}{' '}
                {shift.openedBy?.lastName || ''}
              </Text>
              {shift.closedBy && (
                <Text style={styles.userText}>
                  🔒 {shift.closedBy.firstName || 'N/A'}{' '}
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
    <Surface style={styles.filterContainer} elevation={1}>
      <View style={styles.filterContent}>
        <Menu
          visible={showDateMenu}
          onDismiss={() => setShowDateMenu(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowDateMenu(true)}
              activeOpacity={0.8}
            >
              <Avatar.Icon
                icon="calendar-range"
                size={32}
                style={styles.filterIcon}
                color={theme.colors.primary}
              />
              <View style={styles.filterTextContainer}>
                <Text style={styles.filterLabel}>Filtrar por fecha</Text>
                <Text style={styles.filterValue}>{getDateFilterLabel()}</Text>
              </View>
              <Avatar.Icon
                icon="chevron-down"
                size={24}
                style={styles.filterArrow}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          }
          contentStyle={styles.menuContent}
        >
          <Menu.Item
            onPress={() => {
              setDateFilter('today');
              setShowDateMenu(false);
            }}
            title="Hoy"
            leadingIcon="calendar-today"
            style={dateFilter === 'today' && styles.selectedMenuItem}
          />
          <Menu.Item
            onPress={() => {
              setDateFilter('yesterday');
              setShowDateMenu(false);
            }}
            title="Ayer"
            leadingIcon="calendar-minus"
            style={dateFilter === 'yesterday' && styles.selectedMenuItem}
          />
          <Menu.Item
            onPress={() => {
              setDateFilter('last7');
              setShowDateMenu(false);
            }}
            title="Últimos 7 días"
            leadingIcon="calendar-week"
            style={dateFilter === 'last7' && styles.selectedMenuItem}
          />
          <Divider />
          <Menu.Item
            onPress={handleCustomDateRange}
            title="Rango personalizado"
            leadingIcon="calendar-range"
            style={dateFilter === 'custom' && styles.selectedMenuItem}
          />
        </Menu>
      </View>

      {/* Modal para selección de rango de fechas */}
      <Modal
        visible={showDateRangePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateRangePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <Avatar.Icon
                icon="calendar-range"
                size={48}
                style={styles.modalIcon}
                color={theme.colors.primary}
              />
              <Text style={styles.modalTitle}>Seleccionar rango</Text>
              <IconButton
                icon="close"
                onPress={() => setShowDateRangePicker(false)}
                size={20}
                style={styles.modalCloseButton}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>

            {/* Selección de fechas */}
            <View style={styles.dateRangeContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode('start');
                  setShowDatePicker(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.dateButtonContent}>
                  <Avatar.Icon
                    icon="calendar-start"
                    size={36}
                    style={styles.dateButtonIcon}
                    color={theme.colors.primary}
                  />
                  <View style={styles.dateButtonTextContainer}>
                    <Text style={styles.dateButtonLabel}>DESDE</Text>
                    <Text style={styles.dateButtonValue}>
                      {format(customDateRange.start, 'd MMM yyyy', {
                        locale: es,
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View style={styles.dateArrowContainer}>
                <Avatar.Icon
                  icon="arrow-right"
                  size={20}
                  style={styles.dateArrow}
                  color={theme.colors.primary}
                />
              </View>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode('end');
                  setShowDatePicker(true);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.dateButtonContent}>
                  <Avatar.Icon
                    icon="calendar-end"
                    size={36}
                    style={styles.dateButtonIcon}
                    color={theme.colors.primary}
                  />
                  <View style={styles.dateButtonTextContainer}>
                    <Text style={styles.dateButtonLabel}>HASTA</Text>
                    <Text style={styles.dateButtonValue}>
                      {format(customDateRange.end, 'd MMM yyyy', {
                        locale: es,
                      })}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Botones de acción */}
            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setShowDateRangePicker(false)}
                style={styles.modalButton}
                labelStyle={styles.modalButtonLabel}
              >
                Cancelar
              </Button>
              <Button
                mode="contained"
                onPress={() => {
                  setDateFilter('custom');
                  setShowDateRangePicker(false);
                }}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                labelStyle={styles.modalButtonLabel}
              >
                Aplicar filtro
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={
            datePickerMode === 'start'
              ? customDateRange.start
              : customDateRange.end
          }
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </Surface>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon
        icon="history"
        size={80}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyTitle}>No se encontraron turnos</Text>
      <Text style={styles.emptyMessage}>
        {dateFilter === 'custom'
          ? 'No hay turnos en el rango seleccionado'
          : 'Prueba seleccionando otro rango de fechas'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Avatar.Icon
        icon="alert-circle-outline"
        size={80}
        style={{ backgroundColor: theme.colors.errorContainer }}
        color={theme.colors.error}
      />
      <Text style={styles.errorTitle}>Error al cargar turnos</Text>
      <Text style={styles.errorMessage}>
        {error?.message || 'No se pudieron cargar los turnos'}
      </Text>
      <Button mode="contained" onPress={refetch} style={styles.retryButton}>
        Reintentar
      </Button>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Cargando turnos...</Text>
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    filterContainer: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.s,
      borderRadius: theme.roundness * 2,
      elevation: 1,
    },
    filterContent: {
      padding: theme.spacing.s,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.s,
      borderRadius: theme.roundness,
    },
    filterIcon: {
      backgroundColor: theme.colors.primaryContainer,
      marginRight: theme.spacing.m,
    },
    filterTextContainer: {
      flex: 1,
    },
    filterLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    filterValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    filterArrow: {
      backgroundColor: 'transparent',
    },
    menuContent: {
      backgroundColor: theme.colors.surface,
      marginTop: 40,
      minWidth: 200,
    },
    selectedMenuItem: {
      backgroundColor: theme.colors.primaryContainer,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness * 4,
      marginHorizontal: theme.spacing.xl,
      width: '90%',
      maxWidth: 380,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.outline,
    },
    modalHeader: {
      alignItems: 'center',
      paddingTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.m,
      position: 'relative',
    },
    modalIcon: {
      backgroundColor: theme.colors.primaryContainer,
      marginBottom: theme.spacing.m,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    modalCloseButton: {
      position: 'absolute',
      top: theme.spacing.s,
      right: theme.spacing.s,
    },
    dateRangeContainer: {
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.l,
      flexDirection: 'column',
      gap: theme.spacing.m,
    },
    dateButton: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.roundness * 2,
      borderWidth: 1.5,
      borderColor: theme.colors.outline,
      overflow: 'hidden',
      elevation: 1,
    },
    dateButtonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.m,
      gap: theme.spacing.m,
    },
    dateButtonIcon: {
      backgroundColor: theme.colors.primaryContainer,
    },
    dateButtonTextContainer: {
      flex: 1,
    },
    dateButtonLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 1,
      marginBottom: 2,
    },
    dateButtonValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    dateArrowContainer: {
      alignSelf: 'center',
      paddingVertical: theme.spacing.xs,
    },
    dateArrow: {
      backgroundColor: theme.colors.surfaceVariant,
    },
    modalActions: {
      flexDirection: 'row',
      padding: theme.spacing.l,
      paddingTop: theme.spacing.m,
      gap: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    modalButton: {
      flex: 1,
      borderRadius: theme.roundness * 2,
    },
    modalButtonPrimary: {
      elevation: 0,
    },
    modalButtonLabel: {
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 4,
    },
    listContent: {
      paddingBottom: theme.spacing.m,
    },
    shiftCard: {
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.xs,
      backgroundColor: theme.colors.surface,
    },
    openShiftCard: {
      backgroundColor: theme.colors.primaryContainer,
    },
    shiftHeader: {
      marginBottom: theme.spacing.s,
    },
    shiftTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginBottom: 2,
    },
    shiftNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    shiftDate: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    currentChip: {
      backgroundColor: theme.colors.tertiaryContainer,
    },
    currentChipText: {
      color: theme.colors.onTertiaryContainer,
      fontWeight: '600',
      fontSize: 11,
    },
    statusChip: {
      marginLeft: 'auto',
    },
    statusChipText: {
      fontWeight: '600',
      fontSize: 11,
    },
    divider: {
      marginVertical: theme.spacing.s,
    },
    shiftDetails: {
      gap: theme.spacing.s,
    },
    timeSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    label: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
      textTransform: 'uppercase',
    },
    timeText: {
      fontSize: 14,
      color: theme.colors.onSurface,
    },
    durationText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
    },
    statsSection: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    statCard: {
      flex: 1,
      padding: theme.spacing.s,
      borderRadius: theme.roundness,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: 'center',
      gap: 2,
    },
    statLabel: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    statValue: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
    },
    cashSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.s,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
    },
    cashRow: {
      alignItems: 'center',
    },
    cashLabel: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
    },
    cashValue: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 2,
    },
    differenceLabel: {
      fontWeight: '600',
    },
    differenceValue: {
      fontWeight: '700',
    },
    userSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xs,
    },
    userText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      gap: theme.spacing.l,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
    },
    emptyMessage: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
      gap: theme.spacing.l,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.error,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: theme.spacing.m,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.m,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
    },
  });

  // Renderizado principal
  if (isLoading && !shifts) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {renderLoading()}
      </SafeAreaView>
    );
  }

  if (error && !shifts) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {renderError()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.container}>
        {/* Filtros */}
        {renderFilters()}

        {/* Lista de turnos */}
        {filteredShifts.length === 0 ? (
          renderEmpty()
        ) : (
          <FlashList
            data={filteredShifts}
            renderItem={renderShiftItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={200}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary]}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
