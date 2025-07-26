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
  usePingPrinterMutation,
  useTestPrintPrinter,
} from '../hooks/usePrintersQueries';
import { useCrudScreenLogic } from '../../../app/hooks/useCrudScreenLogic';
import { useDrawerStatus } from '@react-navigation/drawer';
import { useRefreshModuleOnFocus } from '../../../app/hooks/useRefreshOnFocus';

const PrintersScreen: React.FC = () => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );
  const drawerStatus = useDrawerStatus();
  const isDrawerOpen = drawerStatus === 'open';

  const [isDiscoveryModalVisible, setIsDiscoveryModalVisible] = useState(false);
  const [discoveredPrinterData, setDiscoveredPrinterData] =
    useState<Partial<CreateThermalPrinterDto> | null>(null);
  const [pingingPrinterId, setPingingPrinterId] = useState<string | null>(null);
  const [testPrintingPrinterId, setTestPrintingPrinterId] = useState<
    string | null
  >(null);
  const [fabOpen, setFabOpen] = useState(false);

  const queryParams = useMemo(
    () => ({
      isActive: undefined,
      page: 1,
      limit: 50,
    }),
    [],
  );

  const {
    data: printersResponse,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
    error: listError,
  } = usePrintersQuery(queryParams);

  const { mutateAsync: deletePrinter } = useDeletePrinterMutation();
  const pingPrinterMutation = usePingPrinterMutation();
  const testPrintMutation = useTestPrintPrinter();

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
    deleteConfirmation,
  } = useCrudScreenLogic<ThermalPrinter>({
    entityName: 'Impresora',
    queryKey: ['thermalPrinters', queryParams],
    deleteMutationFn: deletePrinter,
  });
  const handlePingPrinter = useCallback(
    async (printerId: string) => {
      setPingingPrinterId(printerId);
      try {
        await pingPrinterMutation.mutateAsync(printerId);
      } catch (error) {
      } finally {
        setPingingPrinterId(null);
      }
    },
    [pingPrinterMutation],
  );

  const handleTestPrint = useCallback(
    async (printerId: string) => {
      setTestPrintingPrinterId(printerId);
      try {
        await testPrintMutation.mutateAsync(printerId);
      } catch (error) {
      } finally {
        setTestPrintingPrinterId(null);
      }
    },
    [testPrintMutation],
  );

  const handleOpenAddModal = () => {
    setDiscoveredPrinterData(null);
    handleOpenCreateModal();
  };

  const handleOpenDiscoveryModal = () => {
    setIsDiscoveryModalVisible(true);
  };

  const handleDismissDiscoveryModal = () => {
    setIsDiscoveryModalVisible(false);
  };

  const handlePrinterSelectedFromDiscovery = (printer: DiscoveredPrinter) => {
    setDiscoveredPrinterData({
      name: printer.name || `Impresora ${printer.ip}`,
      connectionType: 'NETWORK',
      ipAddress: printer.ip,
      port: printer.port,
      macAddress: printer.mac || undefined,
    });
    setIsDiscoveryModalVisible(false);
    handleOpenCreateModal();
  };

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

  const filteredData = useMemo(() => {
    if (!printersResponse?.data) return [];
    return printersResponse.data;
  }, [printersResponse?.data]);

  const { ListEmptyComponent } = useListState({
    isLoading: isLoadingList,
    isError: !!listError,
    data: printersResponse?.data,
    emptyConfig: {
      title: 'No hay impresoras',
      message:
        'No hay impresoras configuradas. Presiona el botón + para agregar una nueva o descubrir impresoras en la red.',
      icon: 'printer-outline',
    },
    errorConfig: {
      title: 'Error al cargar impresoras',
      message: 'No se pudieron cargar las impresoras. Verifica tu conexión.',
      icon: 'alert-circle-outline',
      onAction: refetchList,
      actionLabel: 'Reintentar',
    },
  });

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
        <PrinterDiscoveryModal
          visible={isDiscoveryModalVisible}
          onDismiss={handleDismissDiscoveryModal}
          onPrinterSelect={handlePrinterSelectedFromDiscovery}
        />
        <PrinterFormModal
          visible={isFormModalVisible}
          onDismiss={handleCloseModals}
          editingItem={editingItem}
          initialDataFromDiscovery={
            !editingItem ? (discoveredPrinterData ?? undefined) : undefined
          }
        />
        <PrinterDetailModal
          visible={isDetailModalVisible}
          onDismiss={handleCloseModals}
          printer={selectedItem}
          onEdit={() => selectedItem && handleOpenEditModal(selectedItem)}
          deleteConfirmation={deleteConfirmation}
          onTestPrint={() => selectedItem && handleTestPrint(selectedItem.id)}
          isDeleting={isDeleting}
          isTestPrinting={testPrintingPrinterId === selectedItem?.id}
        />
        <FAB.Group
          open={fabOpen}
          visible={
            !isFormModalVisible &&
            !isDetailModalVisible &&
            !isDiscoveryModalVisible &&
            !isDrawerOpen
          }
          icon={fabOpen ? 'close' : 'plus'}
          actions={[
            {
              icon: 'magnify-scan',
              label: 'Descubrir en Red',
              onPress: handleOpenDiscoveryModal,
              style: { backgroundColor: theme.colors.tertiaryContainer },
              color: theme.colors.onTertiaryContainer,
              labelTextColor: theme.colors.onTertiaryContainer,
              size: 'small',
            },
            {
              icon: 'plus',
              label: 'Añadir Manual',
              onPress: handleOpenAddModal,
              style: { backgroundColor: theme.colors.secondaryContainer },
              color: theme.colors.onSecondaryContainer,
              labelTextColor: theme.colors.onSecondaryContainer,
              size: 'small',
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          onPress={() => {
            if (fabOpen) {
            }
          }}
          fabStyle={{ backgroundColor: theme.colors.primary }}
          color={theme.colors.onPrimary}
        />
      </Portal>
    </SafeAreaView>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    listPadding: {
      paddingBottom: 80,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    actionButton: {
      margin: 0,
      padding: 0,
      width: responsive.isTablet ? 44 : 52,
      height: responsive.isTablet ? 44 : 52,
      borderRadius: responsive.isTablet ? 22 : 26,
      backgroundColor: theme.colors.surfaceVariant,
      elevation: 2,
    },
    pingIndicator: {
      width: responsive.isTablet ? 44 : 52,
      height: responsive.isTablet ? 44 : 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: responsive.isTablet ? 22 : 26,
      backgroundColor: theme.colors.primaryContainer,
      elevation: 2,
    },
    errorText: {
      color: theme.colors.error,
      textAlign: 'center',
      fontSize: responsive.fontSize(14),
    },
  });

export default PrintersScreen;
