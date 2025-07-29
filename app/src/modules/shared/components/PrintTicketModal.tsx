import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text, RadioButton, Surface } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { usePrintersQuery } from '@/modules/printers/hooks/usePrintersQueries';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

interface OrderBasicInfo {
  shiftOrderNumber?: number;
  orderNumber?: string;
  orderType?: 'TAKE_AWAY' | 'DELIVERY' | 'DINE_IN';
  type?: 'TAKE_AWAY' | 'DELIVERY' | 'DINE_IN';
}

interface PrintTicketModalProps {
  visible: boolean;
  onDismiss: () => void;
  order: OrderBasicInfo | null;
  onPrint: (
    printerId: string,
    ticketType: 'GENERAL' | 'BILLING',
  ) => Promise<void>;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  visible,
  onDismiss,
  order,
  onPrint,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { data: printersResponse, isLoading: isLoadingPrinters } =
    usePrintersQuery({ page: 1, limit: 100 });
  const [selectedTicketType, setSelectedTicketType] = useState<
    'GENERAL' | 'BILLING'
  >('GENERAL');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  const printers = printersResponse?.data || [];
  const activePrinters = printers.filter(
    (printer: { isActive: boolean }) => printer.isActive,
  );

  useEffect(() => {
    if (activePrinters.length > 0 && !selectedPrinterId) {
      setSelectedPrinterId((activePrinters[0] as { id: string }).id);
    }
  }, [activePrinters, selectedPrinterId]);

  useEffect(() => {
    if (order) {
      if (order.orderType === 'DINE_IN') {
        setSelectedTicketType('BILLING');
      } else {
        setSelectedTicketType('GENERAL');
      }
    }
  }, [order]);

  const handlePrint = async () => {
    if (!selectedPrinterId || !order) return;

    setIsPrinting(true);
    try {
      await onPrint(selectedPrinterId, selectedTicketType);
      onDismiss();
    } catch (error) {
    } finally {
      setIsPrinting(false);
    }
  };

  if (!order) return null;

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title={`Imprimir Ticket - Orden #${order.shiftOrderNumber}`}
      maxWidthPercent={90}
      maxHeightPercent={85}
      actions={[
        {
          label: 'Cancelar',
          mode: 'outlined',
          onPress: onDismiss,
          disabled: isPrinting,
          colorPreset: 'secondary',
        },
        {
          label: 'Imprimir',
          mode: 'contained',
          onPress: handlePrint,
          loading: isPrinting,
          disabled:
            !selectedPrinterId || activePrinters.length === 0 || isPrinting,
          colorPreset: 'primary',
        },
      ]}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Tipo de Ticket
        </Text>
        <RadioButton.Group
          onValueChange={(value) =>
            setSelectedTicketType(value as 'GENERAL' | 'BILLING')
          }
          value={selectedTicketType}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedTicketType('GENERAL')}
          >
            <Surface
              style={[
                styles.radioItem,
                { backgroundColor: theme.colors.surface },
                selectedTicketType === 'GENERAL'
                  ? styles.selectedGeneralItem
                  : styles.unselectedGeneralItem,
              ]}
            >
              <View style={styles.radioContent}>
                <RadioButton value="GENERAL" color={theme.colors.primary} />
                <View style={styles.radioTextContainer}>
                  <Text
                    style={[
                      styles.radioLabel,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    📋 Ticket General
                  </Text>
                  <Text
                    style={[
                      styles.radioDescription,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Para cocina y delivery (letras grandes)
                  </Text>
                </View>
              </View>
            </Surface>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedTicketType('BILLING')}
          >
            <Surface
              style={[
                styles.radioItem,
                { backgroundColor: theme.colors.surface },
                selectedTicketType === 'BILLING'
                  ? styles.selectedBillingItem
                  : styles.unselectedBillingItem,
              ]}
            >
              <View style={styles.radioContent}>
                <RadioButton value="BILLING" color={theme.colors.primary} />
                <View style={styles.radioTextContainer}>
                  <Text
                    style={[
                      styles.radioLabel,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    💵 Ticket de Cuenta
                  </Text>
                  <Text
                    style={[
                      styles.radioDescription,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Para cobro al cliente (formato cuenta)
                  </Text>
                </View>
              </View>
            </Surface>
          </TouchableOpacity>
        </RadioButton.Group>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
          Seleccionar Impresora
        </Text>
        {isLoadingPrinters ? (
          <ActivityIndicator size="small" color={theme.colors.primary} />
        ) : activePrinters.length === 0 ? (
          <Text style={[styles.noPrintersText, { color: theme.colors.error }]}>
            No hay impresoras activas disponibles
          </Text>
        ) : (
          <RadioButton.Group
            onValueChange={(value) => setSelectedPrinterId(value)}
            value={selectedPrinterId}
          >
            {activePrinters.map((printer: any) => (
              <TouchableOpacity
                key={printer.id}
                activeOpacity={0.7}
                onPress={() => setSelectedPrinterId(printer.id)}
              >
                <Surface
                  style={[
                    styles.radioItem,
                    { backgroundColor: theme.colors.surface },
                    selectedPrinterId === printer.id
                      ? styles.selectedPrinterItem
                      : styles.unselectedPrinterItem,
                  ]}
                >
                  <View style={styles.radioContent}>
                    <RadioButton
                      value={printer.id}
                      color={theme.colors.primary}
                    />
                    <View style={styles.radioTextContainer}>
                      <Text
                        style={[
                          styles.radioLabel,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        🖨️ {printer.name}
                      </Text>
                      <Text
                        style={[
                          styles.radioDescription,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {printer.ipAddress || 'Sin IP'} - Puerto{' '}
                        {printer.port || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </Surface>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        )}
      </View>
    </ResponsiveModal>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    section: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    radioItem: {
      marginBottom: 6,
      borderRadius: 10,
      elevation: 1,
      padding: 2,
    },
    radioContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    radioTextContainer: {
      flex: 1,
      marginLeft: 8,
    },
    radioLabel: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    radioDescription: {
      fontSize: 11,
      opacity: 0.7,
    },
    noPrintersText: {
      fontSize: 13,
      textAlign: 'center',
      padding: 12,
      fontWeight: '500',
    },
    selectedGeneralItem: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    unselectedGeneralItem: {
      borderColor: 'transparent',
      borderWidth: 0,
    },
    selectedBillingItem: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    unselectedBillingItem: {
      borderColor: 'transparent',
      borderWidth: 0,
    },
    selectedPrinterItem: {
      borderColor: theme.colors.primary,
      borderWidth: 2,
    },
    unselectedPrinterItem: {
      borderColor: 'transparent',
      borderWidth: 0,
    },
  });
