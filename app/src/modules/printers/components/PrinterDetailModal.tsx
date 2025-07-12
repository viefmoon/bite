import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Surface,
  IconButton,
  Divider,
  Button,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { ThermalPrinter } from '../types/printer.types';

interface PrinterDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  printer: ThermalPrinter | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onTestPrint?: () => void;
  isDeleting?: boolean;
  isTestPrinting?: boolean;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContent: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.roundness * 3,
      margin: theme.spacing.l,
      maxHeight: '90%',
      overflow: 'hidden',
    },
    header: {
      backgroundColor: theme.colors.primary,
      padding: theme.spacing.l,
      paddingBottom: theme.spacing.m,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTextContainer: {
      flex: 1,
    },
    headerTitle: {
      color: theme.colors.onPrimary,
      fontSize: 20,
      fontWeight: '700',
    },
    headerSubtitle: {
      color: theme.colors.onPrimary,
      opacity: 0.8,
      fontSize: 14,
      marginTop: 4,
    },
    closeButton: {
      margin: -theme.spacing.xs,
    },
    scrollView: {
      maxHeight: 400,
    },
    scrollContent: {
      padding: theme.spacing.l,
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: theme.spacing.s,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.s,
    },
    infoLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
      textAlign: 'right',
      flex: 1,
      marginLeft: theme.spacing.m,
    },
    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.m,
    },
    statusChip: {
      paddingHorizontal: theme.spacing.xs,
    },
    activeChip: {
      backgroundColor: theme.colors.primaryContainer,
    },
    inactiveChip: {
      backgroundColor: theme.colors.errorContainer,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.s,
      marginTop: theme.spacing.s,
    },
    featureCard: {
      padding: theme.spacing.m,
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surfaceVariant,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      minWidth: '45%',
      flex: 1,
    },
    featureIcon: {
      backgroundColor: theme.colors.secondaryContainer,
      borderRadius: theme.roundness,
      padding: theme.spacing.xs,
    },
    featureText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    divider: {
      marginVertical: theme.spacing.m,
    },
    testPrintButton: {
      marginBottom: theme.spacing.m,
      borderColor: theme.colors.primary,
    },
    footer: {
      padding: theme.spacing.l,
      paddingTop: 0,
      gap: theme.spacing.s,
    },
    footerButtons: {
      flexDirection: 'row',
      gap: theme.spacing.s,
    },
    footerButton: {
      flex: 1,
    },
    deleteButton: {
      borderColor: theme.colors.error,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
    },
  });

const PrinterDetailModal: React.FC<PrinterDetailModalProps> = ({
  visible,
  onDismiss,
  printer,
  onEdit,
  onDelete,
  onTestPrint,
  isDeleting = false,
  isTestPrinting = false,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);

  if (!printer && visible) {
    return (
      <Portal>
        <Modal
          visible={visible}
          onDismiss={onDismiss}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No se encontró la impresora</Text>
          </View>
        </Modal>
      </Portal>
    );
  }

  if (!printer) return null;

  const getConnectionInfo = () => {
    if (printer.connectionType === 'NETWORK') {
      return `${printer.ipAddress || 'N/A'}:${printer.port || 9100}`;
    }
    return printer.path || 'N/A';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContent}
      >
        <View>
          <Surface style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{printer.name}</Text>
                <Text style={styles.headerSubtitle}>
                  {printer.connectionType} • {getConnectionInfo()}
                </Text>
              </View>
              <IconButton
                icon="close"
                size={24}
                iconColor={theme.colors.onPrimary}
                onPress={onDismiss}
                style={styles.closeButton}
              />
            </View>
          </Surface>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Estado y características principales */}
            <View style={styles.section}>
              <View style={styles.statusContainer}>
                <Chip
                  mode="flat"
                  style={[
                    styles.statusChip,
                    printer.isActive ? styles.activeChip : styles.inactiveChip,
                  ]}
                  textStyle={{
                    color: printer.isActive
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onErrorContainer,
                  }}
                >
                  {printer.isActive ? 'Activa' : 'Inactiva'}
                </Chip>
                {printer.isDefaultPrinter && (
                  <Chip
                    mode="flat"
                    style={[styles.statusChip, styles.activeChip]}
                    icon="star"
                    textStyle={{ color: theme.colors.onPrimaryContainer }}
                  >
                    Predeterminada
                  </Chip>
                )}
              </View>

              <View style={styles.featuresGrid}>
                {printer.autoDeliveryPrint && (
                  <Surface style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                      <IconButton
                        icon="home-export-outline"
                        size={16}
                        iconColor={theme.colors.onSecondaryContainer}
                        style={{ margin: 0 }}
                      />
                    </View>
                    <Text style={styles.featureText}>
                      Impresión automática para domicilio
                    </Text>
                  </Surface>
                )}
                {printer.autoPickupPrint && (
                  <Surface style={styles.featureCard}>
                    <View style={styles.featureIcon}>
                      <IconButton
                        icon="bag-checked"
                        size={16}
                        iconColor={theme.colors.onSecondaryContainer}
                        style={{ margin: 0 }}
                      />
                    </View>
                    <Text style={styles.featureText}>
                      Impresión automática para llevar
                    </Text>
                  </Surface>
                )}
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Información de conexión */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información de Conexión</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tipo de conexión</Text>
                <Text style={styles.infoValue}>{printer.connectionType}</Text>
              </View>

              {printer.connectionType === 'NETWORK' && (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Dirección IP</Text>
                    <Text style={styles.infoValue}>
                      {printer.ipAddress || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Puerto</Text>
                    <Text style={styles.infoValue}>
                      {printer.port || 'N/A'}
                    </Text>
                  </View>
                  {printer.macAddress && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Dirección MAC</Text>
                      <Text style={styles.infoValue}>{printer.macAddress}</Text>
                    </View>
                  )}
                </>
              )}

              {printer.connectionType !== 'NETWORK' && printer.path && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ruta/ID</Text>
                  <Text style={styles.infoValue}>{printer.path}</Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />

            {/* Configuración del papel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuración del Papel</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ancho del papel</Text>
                <Text style={styles.infoValue}>{printer.paperWidth}mm</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Caracteres por línea</Text>
                <Text style={styles.infoValue}>
                  {printer.charactersPerLine}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Corte automático</Text>
                <Text style={styles.infoValue}>
                  {printer.cutPaper ? 'Sí' : 'No'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Líneas de avance</Text>
                <Text style={styles.infoValue}>{printer.feedLines}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            {/* Información adicional */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información Adicional</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Creada</Text>
                <Text style={styles.infoValue}>
                  {formatDate(printer.createdAt)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Última actualización</Text>
                <Text style={styles.infoValue}>
                  {formatDate(printer.updatedAt)}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {onTestPrint && (
              <Button
                mode="outlined"
                icon="printer-check"
                onPress={onTestPrint}
                loading={isTestPrinting}
                disabled={isTestPrinting || isDeleting}
                style={styles.testPrintButton}
              >
                Imprimir Ticket de Prueba
              </Button>
            )}

            <View style={styles.footerButtons}>
              {onEdit && (
                <Button
                  mode="contained-tonal"
                  onPress={onEdit}
                  disabled={isDeleting || isTestPrinting}
                  style={styles.footerButton}
                >
                  Editar
                </Button>
              )}
              {onDelete && (
                <Button
                  mode="outlined"
                  onPress={onDelete}
                  loading={isDeleting}
                  disabled={isDeleting || isTestPrinting}
                  style={[styles.footerButton, styles.deleteButton]}
                  textColor={theme.colors.error}
                >
                  Eliminar
                </Button>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

export default PrinterDetailModal;
