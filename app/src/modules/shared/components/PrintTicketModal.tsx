import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  RadioButton,
  Button,
  Surface,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { usePrintersQuery } from '@/modules/printers/hooks/usePrintersQueries';

interface OrderBasicInfo {
  shiftOrderNumber: number;
  orderType: 'TAKE_AWAY' | 'DELIVERY' | 'DINE_IN';
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
  const { data: printersResponse, isLoading: isLoadingPrinters } =
    usePrintersQuery({ page: 1, limit: 100 });
  const [selectedTicketType, setSelectedTicketType] = useState<
    'GENERAL' | 'BILLING'
  >('GENERAL');
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);

  const printers = printersResponse?.data || [];
  const activePrinters = printers.filter((printer: any) => printer.isActive);

  useEffect(() => {
    if (activePrinters.length > 0 && !selectedPrinterId) {
      setSelectedPrinterId(activePrinters[0].id);
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
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Imprimir Ticket - Orden #{order.shiftOrderNumber}
          </Text>
          <IconButton
            icon="close"
            size={24}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        <Divider />

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
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
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor:
                        selectedTicketType === 'GENERAL'
                          ? theme.colors.primary
                          : 'transparent',
                      borderWidth: selectedTicketType === 'GENERAL' ? 2 : 0,
                    },
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
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor:
                        selectedTicketType === 'BILLING'
                          ? theme.colors.primary
                          : 'transparent',
                      borderWidth: selectedTicketType === 'BILLING' ? 2 : 0,
                    },
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
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Seleccionar Impresora
            </Text>
            {isLoadingPrinters ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : activePrinters.length === 0 ? (
              <Text
                style={[styles.noPrintersText, { color: theme.colors.error }]}
              >
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
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor:
                            selectedPrinterId === printer.id
                              ? theme.colors.primary
                              : 'transparent',
                          borderWidth: selectedPrinterId === printer.id ? 2 : 0,
                        },
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
                            {printer.ipAddress} - Puerto {printer.port}
                          </Text>
                        </View>
                      </View>
                    </Surface>
                  </TouchableOpacity>
                ))}
              </RadioButton.Group>
            )}
          </View>
        </ScrollView>

        <Divider />

        <View style={styles.footer}>
          <Button
            mode="outlined"
            onPress={onDismiss}
            textColor={theme.colors.error}
            style={[styles.footerButton, { borderColor: theme.colors.error }]}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={handlePrint}
            loading={isPrinting}
            disabled={
              !selectedPrinterId || activePrinters.length === 0 || isPrinting
            }
            style={[styles.footerButton, styles.printButton]}
            buttonColor={theme.colors.primary}
          >
            Imprimir
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    margin: 16,
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    margin: -8,
  },
  content: {
    maxHeight: 400,
  },
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  footerButton: {
    minWidth: 100,
    borderRadius: 8,
  },
  printButton: {
    paddingHorizontal: 4,
  },
});
