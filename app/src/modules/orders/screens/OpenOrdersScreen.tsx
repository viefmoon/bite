import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ActivityIndicator, Button, Appbar, IconButton, Portal } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme'; // Corregida ruta
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { OrdersStackParamList } from '../../../app/navigation/types'; // Corregida ruta
import { useGetOpenOrdersQuery, usePrintKitchenTicketMutation, useUpdateOrderMutation } from '../hooks/useOrdersQueries'; // Importar hooks y mutaciones
import GenericList, { RenderItemConfig } from '../../../app/components/crud/GenericList'; // Importar GenericList
import { Order, OrderStatusEnum, type OrderStatus } from '../types/orders.types'; // Importar OrderStatusEnum y el tipo OrderStatus
import { getApiErrorMessage } from '../../../app/lib/errorMapping'; // Importar mapeo de errores
import { format } from 'date-fns'; // Para formatear fechas
import { es } from 'date-fns/locale'; // Locale español
import PrinterSelectionModal from '../components/PrinterSelectionModal'; // Importar el modal
import type { ThermalPrinter } from '../../printers/types/printer.types';
// Importar el nuevo modal y el tipo de payload
import EditOrderModal, { UpdateOrderPayload } from '../components/EditOrderModal';
// Importar el hook de mutación (lo crearemos después)
// import { useUpdateOrderMutation } from '../hooks/useOrdersQueries';
import { useSnackbarStore } from '../../../app/store/snackbarStore'; // Para mostrar mensajes

type OpenOrdersScreenProps = NativeStackScreenProps<OrdersStackParamList, 'OpenOrders'>;

// Helper para formatear el estado de la orden
const formatOrderStatus = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatusEnum.PENDING: return 'Pendiente';
    case OrderStatusEnum.IN_PROGRESS: return 'En Progreso';
    case OrderStatusEnum.READY: return 'Lista';
    case OrderStatusEnum.DELIVERED: return 'Entregada';
    case OrderStatusEnum.COMPLETED: return 'Completada';
    case OrderStatusEnum.CANCELLED: return 'Cancelada';
    default: return status;
  }
};

const OpenOrdersScreen: React.FC<OpenOrdersScreenProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [isPrinterModalVisible, setIsPrinterModalVisible] = useState(false);
  const [orderToPrintId, setOrderToPrintId] = useState<string | null>(null);
  const printKitchenTicketMutation = usePrintKitchenTicketMutation();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar); // Hook para snackbar (Corregido)

  // Estados para el modal de edición
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null); // Cambiado a ID

  // TODO: Instanciar la mutación de actualización cuando esté creada
  const updateOrderMutation = useUpdateOrderMutation(); // Instanciar la mutación

  const {
    data: ordersData, // Renombrar para claridad, ahora es Order[] | undefined
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useGetOpenOrdersQuery(); // Usar el hook para obtener órdenes abiertas

  const orders = useMemo(() => {
    // Mapear datos para GenericList, añadiendo campos virtuales si es necesario
    // Ahora ordersData es directamente el array Order[] | undefined
    return (ordersData ?? []).map((order: Order) => ({ // Añadir tipo explícito a order
      ...order,
      // Crear un campo de descripción combinando tipo y estado
      _displayDescription: `${order.orderType} - ${formatOrderStatus(order.status)} - ${format(new Date(order.createdAt), 'p', { locale: es })}`,
      // Usar orderNumber como título principal
      _displayTitle: `#${order.dailyNumber}`, // Usar dailyNumber
    }));
  }, [ordersData]); // Depender de ordersData

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleOrderItemPress = (order: Order) => {
    // Guardar solo el ID y abrir el modal
    setEditingOrderId(order.id);
    setIsEditModalVisible(true);
  };

  // Configuración para GenericList
  const listRenderConfig: RenderItemConfig<Order & { _displayDescription: string, _displayTitle: string }> = {
    titleField: '_displayTitle', // Usar el número de orden como título
    descriptionField: '_displayDescription', // Usar la descripción combinada
    // No hay imagen, precio o estado directo aplicable como en otros CRUDs
    // Se podría añadir un statusConfig si se mapea el estado a 'activo'/'inactivo'
  };

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.centered}>
      {isLoading ? (
        <ActivityIndicator animating={true} size="large" />
      ) : isError ? (
        <>
          <Text style={styles.errorText}>Error al cargar órdenes: {getApiErrorMessage(error)}</Text>
          <Button onPress={handleRefresh}>Reintentar</Button>
        </>
      ) : !ordersData || ordersData.length === 0 ? ( // Comprobar ordersData directamente
        <Text style={styles.emptyText}>No hay órdenes abiertas en este momento.</Text>
      ) : null}
    </View>
  ), [isLoading, isError, error, handleRefresh, styles, theme]);

  // Efecto para configurar el botón de refrescar en el header
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Appbar.Action
          icon="refresh"
          onPress={handleRefresh}
          disabled={isFetching} // Deshabilitar mientras se refresca
          color={theme.colors.onPrimary} // Usar color del header
        />
      ),
    });
  }, [navigation, handleRefresh, isFetching, theme.colors.onPrimary]); // Añadir dependencias

  // Función para abrir el modal de selección de impresora
  const handleOpenPrinterModal = useCallback((orderId: string) => {
    setOrderToPrintId(orderId);
    setIsPrinterModalVisible(true);
  }, []);

  // Función que se ejecuta al seleccionar una impresora en el modal
  const handlePrinterSelect = useCallback((printer: ThermalPrinter) => {
    setIsPrinterModalVisible(false);
    if (orderToPrintId) {
      // Llamar a la mutación para imprimir
      printKitchenTicketMutation.mutate({ orderId: orderToPrintId, printerId: printer.id });
      setOrderToPrintId(null); // Limpiar el ID de la orden
    } else {
      console.warn("Se seleccionó una impresora pero no había ID de orden guardado.");
    }
  }, [orderToPrintId]); // Dependencia: orderToPrintId

  // Función para renderizar el botón de imprimir ticket
  const renderItemActions = useCallback((item: Order) => (
    <IconButton
      icon="printer-outline" // Icono de impresora
      size={24}
      onPress={() => handleOpenPrinterModal(item.id)} // Abrir modal al presionar
      // Deshabilitar el botón si esta orden específica se está imprimiendo
      disabled={printKitchenTicketMutation.isPending && printKitchenTicketMutation.variables?.orderId === item.id}
    />
  ), [handleOpenPrinterModal, printKitchenTicketMutation.isPending]); // Añadir dependencia

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <GenericList<Order & { _displayDescription: string, _displayTitle: string }>
        items={orders}
        renderConfig={listRenderConfig}
        onItemPress={handleOrderItemPress}
        onRefresh={handleRefresh}
        isRefreshing={isFetching && !isLoading}
        ListEmptyComponent={ListEmptyComponent}
        isLoading={isLoading && !isFetching && !ordersData} // Mostrar loading solo si no hay datos aún
        // Opciones de filtro y búsqueda no aplicadas por ahora
        // filterOptions={[]}
        // filterValue={''}
        // onFilterChange={() => {}}
        // enableSearch={false}
        showFab={false} // No necesitamos FAB aquí
        showImagePlaceholder={false} // No hay imágenes
        contentContainerStyle={styles.listContentContainer}
        renderItemActions={renderItemActions} // Pasar la función para renderizar acciones
      />
      {/* Modal de Selección de Impresora */}
      <Portal>
        <PrinterSelectionModal
          visible={isPrinterModalVisible}
          onDismiss={() => setIsPrinterModalVisible(false)}
          onPrinterSelect={handlePrinterSelect}
        />
        {/* Modal de Edición de Orden */}
        <EditOrderModal
          visible={isEditModalVisible}
          orderId={editingOrderId} // Pasar ID en lugar del objeto
          onClose={() => {
            setIsEditModalVisible(false);
            setEditingOrderId(null); // Limpiar ID
          }}
          onSaveChanges={async (orderId, payload) => { // orderId ya viene como argumento
            // Llamar a la mutación de actualización
            try {
              await updateOrderMutation.mutateAsync({ orderId, payload });
              // El hook useUpdateOrderMutation ya muestra el snackbar de éxito
              setIsEditModalVisible(false);
              setEditingOrderId(null); // Limpiar ID
            } catch (error) {
              // El hook useUpdateOrderMutation ya muestra el snackbar de error
              console.error("Error al actualizar la orden desde el modal:", error);
            }
          }}
        />
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (theme: AppTheme) => // Usar AppTheme directamente
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: { // No usado directamente por GenericList, pero mantenido por si acaso
      flex: 1,
      padding: theme.spacing.m,
    },
    title: { // No usado directamente por GenericList
      marginBottom: theme.spacing.m,
      textAlign: 'center',
      color: theme.colors.primary,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
      marginTop: 50, // Añadir margen superior para centrar mejor
    },
    emptyText: {
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      textAlign: 'center',
      color: theme.colors.error,
      marginBottom: theme.spacing.m,
    },
    listContentContainer: {
      paddingBottom: theme.spacing.m, // Añadir padding inferior
    },
    // Estilos específicos para los items de la lista de órdenes si GenericList no es suficiente
    // orderItem: { ... },
    // orderNumber: { ... },
    // orderStatus: { ... },
    // orderTime: { ... },
  });

export default OpenOrdersScreen;