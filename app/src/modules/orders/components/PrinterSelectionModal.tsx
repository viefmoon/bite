import React, { useMemo } from 'react';
import { StyleSheet, FlatList, ListRenderItemInfo } from 'react-native';
import { Modal, Portal, List, Divider, Appbar } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { usePrintersQuery } from '../../printers/hooks/usePrintersQueries';
import type { ThermalPrinter } from '../../printers/types/printer.types';
import { useListState } from '../../../app/hooks/useListState';

interface PrinterSelectionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onPrinterSelect: (printer: ThermalPrinter) => void;
  title?: string;
}

const PrinterSelectionModal: React.FC<PrinterSelectionModalProps> = ({
  visible,
  onDismiss,
  onPrinterSelect,
  title = 'Seleccionar Impresora',
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const {
    data: printersResponse,
    isLoading,
    isError,
    error: _error,
    refetch: _refetch,
  } = usePrintersQuery(
    { isActive: true, limit: 100, page: 1 },
    { enabled: visible },
  );

  const printers = useMemo(
    () => printersResponse?.data ?? [],
    [printersResponse],
  );

  const renderPrinterItem = ({ item }: ListRenderItemInfo<ThermalPrinter>) => (
    <List.Item
      title={item.name}
      description={`Tipo: ${item.connectionType}${item.ipAddress ? ` - IP: ${item.ipAddress}` : ''}`}
      left={(props) => <List.Icon {...props} icon="printer" />}
      onPress={() => onPrinterSelect(item)}
      style={styles.listItem}
      titleStyle={styles.itemTitle}
      descriptionStyle={styles.itemDescription}
    />
  );

  const { ListEmptyComponent } = useListState({
    isLoading,
    isError,
    data: printers,
    emptyConfig: {
      title: 'No hay impresoras activas',
      message: 'No hay impresoras activas configuradas.',
      icon: 'printer-off',
    },
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <Appbar.Header style={styles.appBar} elevated>
          <Appbar.BackAction
            onPress={onDismiss}
            color={theme.colors.onSurface}
          />
          <Appbar.Content title={title} titleStyle={styles.appBarTitle} />
        </Appbar.Header>

        <FlatList
          data={printers}
          renderItem={renderPrinterItem}
          keyExtractor={(item: ThermalPrinter) => item.id}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={ListEmptyComponent}
        />
      </Modal>
    </Portal>
  );
};

// --- Estilos ---
const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      width: '90%',
      maxHeight: '70%',
      alignSelf: 'center',
      borderRadius: theme.roundness * 2,
      elevation: 5,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    },
    appBar: {
      backgroundColor: theme.colors.elevation.level2,
    },
    appBarTitle: {
      ...theme.fonts.titleMedium,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    listContentContainer: {
      paddingBottom: theme.spacing.m,
      flexGrow: 1,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.l,
      minHeight: 150,
    },
    statusText: {
      marginTop: theme.spacing.m,
      fontSize: 16,
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
    errorText: {
      marginTop: theme.spacing.m,
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: theme.spacing.m,
    },
    listItem: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.m,
    },
    itemTitle: {
      fontWeight: '500',
    },
    itemDescription: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outlineVariant,
      marginHorizontal: theme.spacing.m,
    },
  });

export default PrinterSelectionModal;
