
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native'; // FlatList eliminado
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list"; // Importar FlashList y tipo
import {
  Modal,
  Portal,
  Text,
  Button,
  ActivityIndicator,
  List,
  Icon, // Añadir Icon a la importación

  Divider,
  IconButton,
  Card,
  Appbar, // Importar Appbar
} from 'react-native-paper';
import { useDiscoverPrinters, useTestPrintDiscoveredPrinter } from '../hooks/usePrintersQueries';
import { DiscoveredPrinter } from '../types/printer.types';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';

interface PrinterDiscoveryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPrinterSelect: (printer: DiscoveredPrinter) => void; // Callback cuando se selecciona una impresora
}

const PrinterDiscoveryModal: React.FC<PrinterDiscoveryModalProps> = ({
  visible,
  onDismiss,
  onPrinterSelect,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const discoverMutation = useDiscoverPrinters();
  const testPrintMutation = useTestPrintDiscoveredPrinter();

  useEffect(() => {
    if (visible) {


      discoverMutation.mutate(undefined, { // undefined para usar la duración por defecto
        onError: (error) => {
           showSnackbar({
             message: `Error descubriendo impresoras: ${getApiErrorMessage(error)}`,
             type: 'error',
           });
        },


      });
    }
  }, [visible]); // Ejecutar solo cuando 'visible' cambia

  const handleRescan = () => {
    discoverMutation.mutate(undefined); // Volver a escanear con duración por defecto
  };

  const handleTestPrint = (printer: DiscoveredPrinter) => {
    testPrintMutation.mutate(printer);
  };

  const renderPrinterItem = ({ item }: ListRenderItemInfo<DiscoveredPrinter>) => ( // Añadir tipo
    <List.Item
      title={item.name || item.ip} // Mostrar nombre o IP si no hay nombre
      description={`IP: ${item.ip}:${item.port}${item.mac ? ` | MAC: ${item.mac}` : ''}${item.model ? ` (${item.model})` : ''}`}
      left={(props) => <List.Icon {...props} icon="printer" />}
      right={(props) => (
        <View style={styles.itemActions}>
          <IconButton
            {...props}
            icon="printer-check"
            size={24}
            onPress={() => handleTestPrint(item)}
            disabled={testPrintMutation.isPending}
            loading={testPrintMutation.isPending && testPrintMutation.variables?.ip === item.ip}
            tooltip="Imprimir prueba"
          />
          <IconButton
            {...props}
            icon="plus"
            size={24}
            onPress={() => onPrinterSelect(item)}
            disabled={testPrintMutation.isPending}
            tooltip="Agregar impresora"
          />
        </View>
      )}
      style={styles.listItem}
      titleStyle={styles.itemTitle}
      descriptionStyle={styles.itemDescription}
    />
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
        dismissable={!discoverMutation.isPending && !testPrintMutation.isPending} // No permitir cerrar mientras busca o imprime
      >
        <Appbar.Header style={styles.appBar} elevated>
          <Appbar.BackAction onPress={onDismiss} disabled={discoverMutation.isPending || testPrintMutation.isPending} />
          <Appbar.Content title="Descubrir Impresoras" titleStyle={styles.appBarTitle} />
          {/* Botón de Refrescar/Re-escanear */}
          <Appbar.Action
            icon="refresh"
            size={32} // <-- Aumentar tamaño del icono
            onPress={handleRescan}
            disabled={discoverMutation.isPending || testPrintMutation.isPending}
            color={theme.colors.primary} // Color distintivo
          />
        </Appbar.Header>

        <View style={styles.contentContainer}>
          {discoverMutation.isPending && (
            <View style={styles.centeredView}>
              <ActivityIndicator animating={true} size="large" />
              <Text style={styles.statusText}>Buscando impresoras en la red...</Text>
              <Text style={styles.statusSubText}>(Esto puede tardar unos segundos)</Text>
            </View>
          )}

          {discoverMutation.isError && !discoverMutation.isPending && (
            <View style={styles.centeredView}>
              <Icon source="alert-circle-outline" color={theme.colors.error} size={48} />
              <Text style={styles.errorText}>
                Error al buscar impresoras: {getApiErrorMessage(discoverMutation.error)}
              </Text>
              {/* Botón eliminado, se usa el icono en Appbar */}
            </View>
          )}

          {discoverMutation.isSuccess && !discoverMutation.isPending && (
            <>
              {discoverMutation.data.length === 0 ? (
                <View style={styles.centeredView}>
                   <Icon source="printer-off" color={theme.colors.onSurfaceVariant} size={48} />
                  <Text style={styles.statusText}>No se encontraron impresoras.</Text>
                  <Text style={styles.statusSubText}>Asegúrate de que estén encendidas y en la misma red.</Text>
                  {/* Botón eliminado, se usa el icono en Appbar */}
                </View>
              ) : (
                <>
                  {/* Texto estilizado */}
                  <Text style={styles.foundText}>Impresoras encontradas:</Text>
                  <FlashList
                    data={discoverMutation.data}
                    renderItem={renderPrinterItem}
                    keyExtractor={(item: DiscoveredPrinter) => `${item.ip}:${item.port}`} // Añadir tipo y clave única
                    estimatedItemSize={70} // Añadir tamaño estimado
                    ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                  />
                   {/* Botón eliminado, se usa el icono en Appbar */}
                </>
              )}
            </>
          )}
        </View>

        {/* Footer eliminado, se usa Appbar.BackAction */}
      </Modal>
    </Portal>
  );
};

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,

      width: '100%',
      height: '100%',
      margin: 0,

      justifyContent: 'flex-start', // Alinear contenido arriba
    },
    appBar: {
      backgroundColor: theme.colors.elevation.level2,
    },
    appBarTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'center', // Centrar título
    },
    contentContainer: {
      flex: 1, // Ocupar espacio restante
      padding: theme.spacing.m,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
    },
    statusText: {
      marginTop: theme.spacing.m,
      fontSize: 16,
      textAlign: 'center',
      color: theme.colors.onSurface,
    },
    statusSubText: {
        marginTop: theme.spacing.xs,
        fontSize: 14,
        textAlign: 'center',
        color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      marginTop: theme.spacing.m,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.m,
    },
    foundText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: theme.spacing.m,
        color: theme.colors.primary, // Color primario para destacar
    },
    list: {
      flex: 1, // Permitir que la lista ocupe espacio
      marginBottom: theme.spacing.m, // Espacio antes del botón de re-escanear
    },
    listItem: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.roundness,
      marginBottom: theme.spacing.xs,
    },
    itemTitle: {
        fontWeight: '500',
    },
    itemDescription: {
        fontSize: 12,
        color: theme.colors.onSurfaceVariant,
    },
    itemActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    divider: {
      height: 0, // Ocultar divider si no se desea

    },
    button: {
      marginTop: theme.spacing.m,
      minWidth: 150, // Ancho mínimo para botones
    },
    // Estilo footer eliminado
  });

export default PrinterDiscoveryModal;