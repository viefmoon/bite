import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import {
  Modal,
  Portal,
  Text,
  ActivityIndicator,
  List,
  Icon,
  Divider,
  IconButton,
  Appbar,
} from 'react-native-paper';
import {
  useDiscoverPrinters,
  useTestPrintDiscoveredPrinter,
} from '../hooks/usePrintersQueries';
import { DiscoveredPrinter } from '../types/printer.types';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { getApiErrorMessage } from '@/app/lib/errorMapping';

interface PrinterDiscoveryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPrinterSelect: (printer: DiscoveredPrinter) => void;
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
      discoverMutation.mutate(undefined, {
        onError: (error) => {
          showSnackbar({
            message: `Error descubriendo impresoras: ${getApiErrorMessage(error)}`,
            type: 'error',
          });
        },
      });
    }
  }, [visible, discoverMutation, showSnackbar]);

  const handleRescan = () => {
    discoverMutation.mutate(undefined);
  };

  const handleTestPrint = (printer: DiscoveredPrinter) => {
    testPrintMutation.mutate(printer);
  };

  const renderPrinterItem = ({
    item,
  }: ListRenderItemInfo<DiscoveredPrinter>) => (
    <List.Item
      title={item.name || item.ip}
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
            loading={
              testPrintMutation.isPending &&
              testPrintMutation.variables?.ip === item.ip
            }
          />
          <IconButton
            {...props}
            icon="plus"
            size={24}
            onPress={() => onPrinterSelect(item)}
            disabled={testPrintMutation.isPending}
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
        dismissable={
          !discoverMutation.isPending && !testPrintMutation.isPending
        }
      >
        <Appbar.Header style={styles.appBar} elevated>
          <Appbar.BackAction
            onPress={onDismiss}
            disabled={discoverMutation.isPending || testPrintMutation.isPending}
          />
          <Appbar.Content
            title="Descubrir Impresoras"
            titleStyle={styles.appBarTitle}
          />
          <Appbar.Action
            icon="refresh"
            size={32}
            onPress={handleRescan}
            disabled={discoverMutation.isPending || testPrintMutation.isPending}
            color={theme.colors.primary}
          />
        </Appbar.Header>

        <View style={styles.contentContainer}>
          {discoverMutation.isPending && (
            <View style={styles.centeredView}>
              <ActivityIndicator animating={true} size="large" />
              <Text style={styles.statusText}>
                Buscando impresoras en la red...
              </Text>
              <Text style={styles.statusSubText}>
                (Esto puede tardar unos segundos)
              </Text>
            </View>
          )}

          {discoverMutation.isError && !discoverMutation.isPending && (
            <View style={styles.centeredView}>
              <Icon
                source="alert-circle-outline"
                color={theme.colors.error}
                size={48}
              />
              <Text style={styles.errorText}>
                Error al buscar impresoras:{' '}
                {getApiErrorMessage(discoverMutation.error)}
              </Text>
            </View>
          )}

          {discoverMutation.isSuccess && !discoverMutation.isPending && (
            <>
              {discoverMutation.data.length === 0 ? (
                <View style={styles.centeredView}>
                  <Icon
                    source="printer-off"
                    color={theme.colors.onSurfaceVariant}
                    size={48}
                  />
                  <Text style={styles.statusText}>
                    No se encontraron impresoras.
                  </Text>
                  <Text style={styles.statusSubText}>
                    Asegúrate de que estén encendidas y en la misma red.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.foundText}>Impresoras encontradas:</Text>
                  <FlashList
                    data={discoverMutation.data}
                    renderItem={renderPrinterItem}
                    keyExtractor={(item: DiscoveredPrinter) =>
                      `${item.ip}:${item.port}`
                    }
                    estimatedItemSize={70}
                    ItemSeparatorComponent={() => (
                      <Divider style={styles.divider} />
                    )}
                  />
                </>
              )}
            </>
          )}
        </View>
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

      justifyContent: 'flex-start',
    },
    appBar: {
      backgroundColor: theme.colors.elevation.level2,
    },
    appBarTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    contentContainer: {
      flex: 1,
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
      color: theme.colors.primary,
    },
    list: {
      flex: 1,
      marginBottom: theme.spacing.m,
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
      height: 0,
    },
    button: {
      marginTop: theme.spacing.m,
      minWidth: 150,
    },
  });

export default PrinterDiscoveryModal;
