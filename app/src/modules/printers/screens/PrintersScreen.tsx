import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Portal, ActivityIndicator, IconButton, FAB } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { useResponsive } from '../../../app/hooks/useResponsive';
import PrinterDiscoveryModal from '../components/PrinterDiscoveryModal';
import PrinterFormModal from '../components/PrinterFormModal';
import PrinterListItem from '../components/PrinterListItem';
import PrinterDetailModal from '../components/PrinterDetailModal';
import {
  DiscoveredPrinter,
  ThermalPrinter,
  CreateThermalPrinterDto,
} from '../types/printer.types';
import { useListState } from '../../../app/hooks/useListState';
import {
  usePrintersQuery,
  useDeletePrinterMutation,
  usePingPrinterMutation, // <-- Importar hook de ping
  useTestPrintPrinter, // <-- Importar hook de test print
} from '../hooks/usePrintersQueries';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic'; // Importar hook CRUD
import { useDrawerStatus } from '@react-navigation/drawer';
import { useRefreshModuleOnFocus } from '../../../app/hooks/useRefreshOnFocus';

type StatusFilter = 'all' | 'active' | 'inactive';

const PrintersScreen: React.FC = () => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [isDiscoveryModalVisible, setIsDiscoveryModalVisible] = useState(false);
  const [discoveredPrinterData, setDiscoveredPrinterData] =
    useState<Partial<CreateThermalPrinterDto> | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pingingPrinterId, setPingingPrinterId] = useState<string | null>(null);
  const [testPrintingPrinterId, setTestPrintingPrinterId] = useState<
    string | null
  >(null);
  const [fabOpen, setFabOpen] = useState(false); // Estado para el FAB.Group

  // --- Lógica CRUD ---
  const queryParams = useMemo(
    () => ({
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
      // Añadir otros filtros si son necesarios (ej. name, connectionType)
      page: 1, // O manejar paginación si es necesario
      limit: 50, // Ajustar límite según necesidad
    }),
    [statusFilter],
  );

  const {
    data: printersResponse,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
    error: listError,
  } = usePrintersQuery(queryParams);

  const { mutateAsync: deletePrinter } = useDeletePrinterMutation();
  const pingPrinterMutation = usePingPrinterMutation(); // Instanciar la mutación de ping
  const testPrintMutation = useTestPrintPrinter(); // Instanciar la mutación de test print

  // Refrescar impresoras cuando la pantalla recibe foco
  useRefreshModuleOnFocus('thermalPrinters');

  const {
    isFormModalVisible,
    isDetailModalVisible,
    editingItem,
    selectedItem,
    isDeleting,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleOpenDetailModal,
    handleCloseModals,
    handleDeleteItem,
  } = useCrudScreenLogic<ThermalPrinter>({
    entityName: 'Impresora',
    queryKey: ['thermalPrinters', queryParams], // Usar queryKey consistente
    deleteMutationFn: deletePrinter,
  });
  // --- Fin Lógica CRUD ---

  // Handler para imprimir ticket de prueba
  const handleTestPrint = useCallback(
    async (printerId: string) => {
      setTestPrintingPrinterId(printerId);
      try {
        await testPrintMutation.mutateAsync(printerId);
      } catch (error) {
        // El error ya se maneja en el hook con un snackbar
      } finally {
        setTestPrintingPrinterId(null);
      }
    },
    [testPrintMutation],
  );

  const handleOpenAddModal = () => {
    setDiscoveredPrinterData(null); // Limpiar datos de descubrimiento
    handleOpenCreateModal(); // Abrir modal de formulario vacío
  };

  const handleOpenDiscoveryModal = () => {
    setIsDiscoveryModalVisible(true);
  };

  const handleDismissDiscoveryModal = () => {
    setIsDiscoveryModalVisible(false);
  };

  const handlePrinterSelectedFromDiscovery = (printer: DiscoveredPrinter) => {
    // Pre-rellenar datos para el formulario
    setDiscoveredPrinterData({
      name: printer.name || `Impresora ${printer.ip}`,
      connectionType: 'NETWORK', // Asumir NETWORK
      ipAddress: printer.ip,
      port: printer.port,
      macAddress: printer.mac || undefined,
    });
    setIsDiscoveryModalVisible(false); // Cerrar modal de descubrimiento
    handleOpenCreateModal(); // Abrir modal de formulario con datos pre-rellenados
  };

  // Función para renderizar cada impresora
  const renderPrinter = useCallback(
    ({ item }: { item: ThermalPrinter }) => {
      const isPingingThis = pingingPrinterId === item.id;
      const canPing = item.connectionType === 'NETWORK';

      return (
        <PrinterListItem
          printer={item}
          onPress={() => handleOpenDetailModal(item)}
          renderActions={
            <View style={styles.itemActionsContainer}>
              {isPingingThis ? (
                <ActivityIndicator size={32} style={styles.pingIndicator} />
              ) : (
                <IconButton
                  icon="radar"
                  size={32}
                  onPress={() => handlePingPrinter(item.id)}
                  disabled={!canPing || pingPrinterMutation.isPending}
                  iconColor={
                    canPing
                      ? theme.colors.primary
                      : theme.colors.onSurfaceDisabled
                  }
                  style={styles.actionButton}
                />
              )}
            </View>
          }
        />
      );
    },
    [
      pingingPrinterId,
      pingPrinterMutation.isPending,
      handlePingPrinter,
      handleOpenDetailModal,
      theme.colors,
      styles,
    ],
  );

  // Filtrar datos según el estado seleccionado
  const filteredData = useMemo(() => {
    if (!printersResponse?.data) return [];
    if (statusFilter === 'all') return printersResponse.data;
    return printersResponse.data.filter(
      (printer) => printer.isActive === (statusFilter === 'active'),
    );
  }, [printersResponse?.data, statusFilter]);

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingList,
    isError: !!listError,
    data: printersResponse?.data,
    emptyConfig: {
      title: 'No hay impresoras',
      message:
        statusFilter !== 'all'
          ? `No hay impresoras ${statusFilter === 'active' ? 'activas' : 'inactivas'} configuradas.`
          : 'No hay impresoras configuradas. Presiona el botón + para agregar una nueva o descubrir impresoras en la red.',
      icon: 'printer-outline',
    },
    errorConfig: {
      title: 'Error al cargar impresoras',
      message: 'No se pudieron cargar las impresoras. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onRetry: refetchList,
    },
  });


  // --- Funcionalidad de Ping ---
  const handlePingPrinter = useCallback(
    async (printerId: string) => {
      setPingingPrinterId(printerId);
      try {
        await pingPrinterMutation.mutateAsync(printerId);
      } catch (error) {
        // El error ya se maneja en el hook con un snackbar
      } finally {
        setPingingPrinterId(null);
      }
    },
    [pingPrinterMutation],
  );

  // Función para renderizar cuando no hay datos
  const renderEmptyList = () => {
    if (isLoadingList) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return ListEmptyComponent;
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Eliminar la View de headerButtons */}

      <FlatList
        data={filteredData}
        renderItem={renderPrinter}
        keyExtractor={(item) => item.id}
        onRefresh={refetchList}
        refreshing={isFetchingList && !isLoadingList}
        ListEmptyComponent={renderEmptyList()}
        contentContainerStyle={[
          styles.listPadding,
          filteredData.length === 0 && styles.emptyListContainer,
        ]}
      />

      <Portal>
        {/* Modal de Descubrimiento */}
        <PrinterDiscoveryModal
          visible={isDiscoveryModalVisible}
          onDismiss={handleDismissDiscoveryModal}
          onPrinterSelect={handlePrinterSelectedFromDiscovery}
        />
        {/* Modal de Formulario */}
        <PrinterFormModal
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          editingItem={editingItem}
          // Pasar datos descubiertos al crear, usar undefined en lugar de null
          initialDataFromDiscovery={
            !editingItem ? (discoveredPrinterData ?? undefined) : undefined
          }
        />
        {/* Modal de Detalle Personalizado */}
        <PrinterDetailModal
          visible={isDetailModalVisible}
          onDismiss={handleCloseModals}
          printer={selectedItem}
          onEdit={() => selectedItem && handleOpenEditModal(selectedItem)}
          onDelete={() => selectedItem && handleDeleteItem(selectedItem.id)}
          onTestPrint={() => selectedItem && handleTestPrint(selectedItem.id)}
          isDeleting={isDeleting}
          isTestPrinting={testPrintingPrinterId === selectedItem?.id}
        />
        {/* Añadir FAB.Group dentro del Portal */}
        <FAB.Group
          open={fabOpen}
          visible={
            !isFormModalVisible &&
            !isDetailModalVisible &&
            !isDiscoveryModalVisible &&
            !isDrawerOpen
          } // Ocultar si hay modales abiertos o drawer
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'magnify-scan',
              label: 'Descubrir en Red',
              onPress: handleOpenDiscoveryModal,
              style: { backgroundColor: theme.colors.tertiaryContainer }, // Color diferente
              color: theme.colors.onTertiaryContainer,
              labelTextColor: theme.colors.onTertiaryContainer,
              size: 'small',
            },
            {
              icon: 'plus',
              label: 'Añadir Manual',
              onPress: handleOpenAddModal,
              style: { backgroundColor: theme.colors.secondaryContainer }, // Color diferente
              color: theme.colors.onSecondaryContainer,
              labelTextColor: theme.colors.onSecondaryContainer,
              size: 'small',
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          onPress={() => {
            if (fabOpen) {
              // Acción opcional al cerrar el FAB principal
            }
          }}
          fabStyle={{ backgroundColor: theme.colors.primary }} // Color principal para el FAB
          color={theme.colors.onPrimary} // Color del icono principal
        />
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Eliminar estilos de headerButtons
    listPadding: {
      paddingBottom: 80, // Espacio para que el FAB no tape el último item
      paddingTop: responsive.spacing(theme.spacing.s),
    },
    emptyListContainer: {
      flex: 1,
      minHeight: responsive.isTablet ? 350 : 400,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing(theme.spacing.xl),
    },
    itemActionsContainer: {
      // Contenedor para los botones de acción de cada item
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    actionButton: {
      // Estilo base para botones de acción en la lista
      margin: 0,
      padding: 0,
      width: responsive.isTablet ? 44 : 52, // Más pequeño en tablet
      height: responsive.isTablet ? 44 : 52, // Más pequeño en tablet
      borderRadius: responsive.isTablet ? 22 : 26, // Redondeado perfecto
      backgroundColor: theme.colors.surfaceVariant, // Fondo para hacerlo más atractivo
      elevation: 2, // Sombra sutil para darle profundidad
    },
    pingIndicator: {
      // Estilo para el indicador de carga del ping
      width: responsive.isTablet ? 44 : 52, // Mismo ancho que el botón
      height: responsive.isTablet ? 44 : 52, // Mismo alto
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: responsive.isTablet ? 22 : 26, // Redondeado perfecto
      backgroundColor: theme.colors.primaryContainer, // Fondo de color primario
      elevation: 2, // Sombra sutil
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      fontSize: responsive.fontSize(14),
    },
  });

export default PrintersScreen;
