import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Surface,
  IconButton,
  Divider,
  Chip,
  Button,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { ThermalPrinter } from '../types/printer.types';
import { ResponsiveModal } from '../../../app/components/responsive/ResponsiveModal';

interface PrinterDetailModalProps {
  visible: boolean;
  onDismiss: () => void;
  printer: ThermalPrinter | null;
  onEdit?: () => void;
  deleteConfirmation?: () => void;
  onTestPrint?: () => void;
  isDeleting?: boolean;
  isTestPrinting?: boolean;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    contentContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.m,
      paddingTop: theme.spacing.s,
    },
    section: {
      marginBottom: theme.spacing.m,
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
      paddingVertical: theme.spacing.xs,
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
      marginBottom: theme.spacing.s,
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
      marginVertical: theme.spacing.s,
    },
    testPrintSection: {
      marginTop: theme.spacing.m,
      paddingTop: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    testPrintButton: {
      alignSelf: 'center',
      minWidth: 200,
    },
    emptyState: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 16,
    },
    iconButtonCompact: {
      margin: 0,
    },
  });

const PrinterDetailModal: React.FC<PrinterDetailModalProps> = ({
  visible,
  onDismiss,
  printer,
  onEdit,
  deleteConfirmation,
  onTestPrint,
  isDeleting = false,
  isTestPrinting = false,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  const actions = useMemo(() => {
    const actionList = [];

    if (onEdit) {
      actionList.push({
        label: 'Editar',
        mode: 'contained-tonal' as const,
        onPress: onEdit,
        disabled: isDeleting || isTestPrinting,
        colorPreset: 'primary' as const,
      });
    }

    if (deleteConfirmation) {
      actionList.push({
        label: 'Eliminar',
        mode: 'outlined' as const,
        onPress: deleteConfirmation,
        loading: isDeleting,
        disabled: isDeleting || isTestPrinting,
        colorPreset: 'error' as const,
      });
    }

    return actionList;
  }, [onEdit, deleteConfirmation, isTestPrinting, isDeleting]);

  if (!printer && visible) {
    return (
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title="Detalles de Impresora"
        maxWidthPercent={95}
        maxHeightPercent={85}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No se encontró la impresora</Text>
        </View>
      </ResponsiveModal>
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
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      title={printer.name}
      maxWidthPercent={95}
      maxHeightPercent={90}
      dismissable={!isDeleting && !isTestPrinting}
      isLoading={isDeleting}
      actions={actions}
      showCloseButton
    >
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
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
                    style={styles.iconButtonCompact}
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
                    style={styles.iconButtonCompact}
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
                <Text style={styles.infoValue}>{printer.port || 'N/A'}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración del Papel</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ancho del papel</Text>
            <Text style={styles.infoValue}>{printer.paperWidth}mm</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Caracteres por línea</Text>
            <Text style={styles.infoValue}>{printer.charactersPerLine}</Text>
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

        {onTestPrint && (
          <View style={styles.testPrintSection}>
            <Button
              mode="outlined"
              icon="printer-check"
              onPress={onTestPrint}
              loading={isTestPrinting}
              disabled={isTestPrinting || isDeleting}
              style={styles.testPrintButton}
            >
              Test de Impresión
            </Button>
          </View>
        )}

        <Divider style={styles.divider} />

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
    </ResponsiveModal>
  );
};

export default PrinterDetailModal;
