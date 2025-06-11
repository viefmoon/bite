import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Surface,
  Portal,
  ActivityIndicator,
  IconButton,
  FAB, // <-- Importar FAB
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import PrinterDiscoveryModal from '../components/PrinterDiscoveryModal';
import PrinterFormModal from '../components/PrinterFormModal'; // Importar el nuevo modal
import GenericList, {
  RenderItemConfig,
  FilterOption,
} from '../../../app/components/crud/GenericList'; // Importar GenericList
import GenericDetailModal, {
  DisplayFieldConfig,
} from '../../../app/components/crud/GenericDetailModal'; // Importar GenericDetailModal
import {
  DiscoveredPrinter,
  ThermalPrinter,
  CreateThermalPrinterDto,
  UpdateThermalPrinterDto,
  PrinterConnectionType,
} from '../types/printer.types';
import { useListState } from '../../../app/hooks/useListState';
import {
  usePrintersQuery,
  useCreatePrinterMutation,
  useUpdatePrinterMutation,
  useDeletePrinterMutation,
  usePingPrinterMutation, // <-- Importar hook de ping
} from '../hooks/usePrintersQueries';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic'; // Importar hook CRUD
import { useDrawerStatus } from '@react-navigation/drawer';

type StatusFilter = 'all' | 'active' | 'inactive';

const PrintersScreen: React.FC = () => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [isDiscoveryModalVisible, setIsDiscoveryModalVisible] = useState(false);
  const [discoveredPrinterData, setDiscoveredPrinterData] =
    useState<Partial<CreateThermalPrinterDto> | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pingingPrinterId, setPingingPrinterId] = useState<string | null>(null);
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

  // Configuración para GenericList
  const listRenderConfig: RenderItemConfig<ThermalPrinter> = {
    titleField: 'name',
    descriptionField: 'ipAddress', // Usar este campo, GenericList lo mostrará
    // descriptionRender eliminado, GenericList debería manejar la lógica de descripción básica o se ajusta GenericList
    statusConfig: {
      field: 'isActive',
      activeValue: true,
      activeLabel: 'Activa',
      inactiveLabel: 'Inactiva',
    },
  };

  // Configuración para GenericDetailModal
  const detailFields: DisplayFieldConfig<ThermalPrinter>[] = [
    { field: 'connectionType', label: 'Tipo Conexión' },
    { field: 'ipAddress', label: 'Dirección IP' },
    { field: 'port', label: 'Puerto' },
    { field: 'path', label: 'Ruta/ID' },
    { field: 'macAddress', label: 'MAC Address' },
  ];

  const filterOptions: FilterOption<StatusFilter>[] = [
    { value: 'all', label: 'Todas' },
    { value: 'active', label: 'Activas' },
    { value: 'inactive', label: 'Inactivas' },
  ];

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
  });

  // Wrapper para el cambio de filtro
  const handleFilterChange = useCallback((value: string | number) => {
    // Asegurar que el valor sea uno de los esperados por StatusFilter
    if (value === 'all' || value === 'active' || value === 'inactive') {
      setStatusFilter(value as StatusFilter);
    } else {
      // Opcional: manejar caso inesperado, por ahora default a 'all'
      setStatusFilter('all');
    }
  }, []);

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

  const renderItemActions = useCallback(
    (item: ThermalPrinter) => {
      const isPingingThis = pingingPrinterId === item.id;
      const canPing = item.connectionType === 'NETWORK';

      return (
        <View style={styles.itemActionsContainer}>
          {isPingingThis ? (
            <ActivityIndicator size={24} style={styles.pingIndicator} />
          ) : (
            <IconButton
              icon="access-point-network" // Icono para ping
              size={24}
              onPress={() => handlePingPrinter(item.id)}
              disabled={!canPing || pingPrinterMutation.isPending} // Deshabilitar si no es NETWORK o si hay un ping en curso
              iconColor={
                canPing ? theme.colors.primary : theme.colors.onSurfaceDisabled
              } // Usar color para deshabilitado
              style={styles.actionButton}
            />
          )}
        </View>
      );
    },
    [
      pingingPrinterId,
      pingPrinterMutation.isPending,
      handlePingPrinter,
      theme.colors,
      styles,
    ],
  );
  // --- Fin Funcionalidad de Ping ---

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Eliminar la View de headerButtons */}

      <GenericList<ThermalPrinter>
        items={printersResponse?.data ?? []}
        renderConfig={listRenderConfig}
        onItemPress={handleOpenDetailModal} // Abrir detalle al presionar
        onRefresh={refetchList}
        isRefreshing={isFetchingList && !isLoadingList}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoadingList && !isFetchingList}
        filterValue={statusFilter}
        onFilterChange={handleFilterChange} // Usar el wrapper
        filterOptions={filterOptions}
        // showFab ya no es necesario aquí, se maneja con FAB.Group
        isModalOpen={
          isFormModalVisible || isDetailModalVisible || isDiscoveryModalVisible
        }
        showImagePlaceholder={false} // No hay imágenes para impresoras
        isDrawerOpen={isDrawerOpen}
        contentContainerStyle={styles.listPadding} // Añadir padding inferior
        renderItemActions={renderItemActions} // <-- Pasar la función para renderizar acciones
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
        {/* Modal de Detalle */}
        <GenericDetailModal<ThermalPrinter>
          visible={isDetailModalVisible}
          onDismiss={handleCloseModals}
          item={selectedItem}
          titleField="name"
          statusConfig={listRenderConfig.statusConfig}
          fieldsToDisplay={detailFields}
          onEdit={() => selectedItem && handleOpenEditModal(selectedItem)}
          onDelete={() => selectedItem && handleDeleteItem(selectedItem.id)}
          isDeleting={isDeleting}
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Eliminar estilos de headerButtons
    listPadding: {
      paddingBottom: 80, // Espacio para que el FAB no tape el último item
    },
    emptyListContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
      minHeight: 200, // Asegurar altura mínima
    },
    emptyListText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      textAlign: 'center',
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
      width: 40, // Ancho fijo para alinear
      height: 40, // Alto fijo para alinear
    },
    pingIndicator: {
      // Estilo para el indicador de carga del ping
      width: 40, // Mismo ancho que el botón para mantener alineación
      height: 40, // Mismo alto
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
    },
  });

export default PrintersScreen;
