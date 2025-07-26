import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Icon, Chip } from 'react-native-paper';
import { useAppTheme, AppTheme } from '../../../app/styles/theme';
import { ThermalPrinter } from '../types/printer.types';

interface PrinterListItemProps {
  printer: ThermalPrinter;
  onPress: () => void;
  renderActions?: React.ReactNode;
}

const getStyles = (theme: AppTheme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: theme.spacing.m,
      marginVertical: theme.spacing.xs,
      borderRadius: theme.roundness * 2,
      overflow: 'hidden',
      elevation: 2,
    },
    pressable: {
      padding: theme.spacing.m,
    },
    content: {
      gap: theme.spacing.s,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      flex: 1,
      marginRight: 60,
    },
    printerIcon: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: theme.roundness,
      padding: theme.spacing.xs,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    connectionInfo: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    statusBadge: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
    },
    activeBadge: {
      borderColor: theme.colors.primary,
    },
    inactiveBadge: {
      borderColor: theme.colors.error,
    },
    detailsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      marginRight: 60,
    },
    detailChip: {
      height: 24,
      backgroundColor: theme.colors.surfaceVariant,
    },
    detailChipLabel: {
      fontSize: 11,
      marginHorizontal: 8,
      marginVertical: 0,
    },
    featuresRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      marginRight: 60,
    },
    featureChip: {
      height: 28,
      backgroundColor: theme.colors.secondaryContainer,
    },
    featureChipLabel: {
      fontSize: 12,
      marginHorizontal: 10,
      marginVertical: 0,
      color: theme.colors.onSecondaryContainer,
    },
    actionsContainer: {
      position: 'absolute',
      right: theme.spacing.m,
      top: theme.spacing.m,
    },
  });

const PrinterListItem: React.FC<PrinterListItemProps> = ({
  printer,
  onPress,
  renderActions,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => getStyles(theme), [theme]);

  const getConnectionDisplay = () => {
    if (printer.connectionType === 'NETWORK' && printer.ipAddress) {
      return `${printer.ipAddress}:${printer.port || 9100}`;
    }
    return printer.connectionType;
  };

  const hasAutoPrintFeatures =
    printer.autoDeliveryPrint || printer.autoPickupPrint;

  return (
    <Surface style={styles.container}>
      <Pressable
        style={styles.pressable}
        onPress={onPress}
        android_ripple={{ color: theme.colors.primary + '20' }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.printerIcon}>
                <Icon
                  source="printer"
                  size={20}
                  color={theme.colors.onPrimaryContainer}
                />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{printer.name}</Text>
                <Text style={styles.connectionInfo}>
                  {getConnectionDisplay()}
                </Text>
              </View>
            </View>
            {renderActions && (
              <View style={styles.actionsContainer}>{renderActions}</View>
            )}
          </View>

          <View style={styles.detailsContainer}>
            <Chip
              mode="flat"
              style={[
                styles.statusBadge,
                printer.isActive ? styles.activeBadge : styles.inactiveBadge,
              ]}
              textStyle={[
                styles.detailChipLabel,
                {
                  color: printer.isActive
                    ? theme.colors.primary
                    : theme.colors.error,
                },
              ]}
            >
              {printer.isActive ? 'Activa' : 'Inactiva'}
            </Chip>

            {printer.isDefaultPrinter && (
              <Chip
                mode="flat"
                style={styles.detailChip}
                textStyle={styles.detailChipLabel}
                icon="star"
              >
                Predeterminada
              </Chip>
            )}

            <Chip
              mode="flat"
              style={styles.detailChip}
              textStyle={styles.detailChipLabel}
              icon="file-document-outline"
            >
              {printer.paperWidth}mm
            </Chip>
          </View>

          {hasAutoPrintFeatures && (
            <View style={styles.featuresRow}>
              {printer.autoDeliveryPrint && (
                <Chip
                  mode="flat"
                  style={styles.featureChip}
                  textStyle={styles.featureChipLabel}
                  icon="home-export-outline"
                >
                  Auto Domicilio
                </Chip>
              )}
              {printer.autoPickupPrint && (
                <Chip
                  mode="flat"
                  style={styles.featureChip}
                  textStyle={styles.featureChipLabel}
                  icon="bag-checked"
                >
                  Auto Para Llevar
                </Chip>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Surface>
  );
};

export default PrinterListItem;
