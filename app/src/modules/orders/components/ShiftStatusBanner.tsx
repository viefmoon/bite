import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, ActivityIndicator, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/app/styles/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Shift } from '@/services/shifts';

interface ShiftStatusBannerProps {
  shift: Shift | null;
  loading: boolean;
  onOpenShift: () => void;
  canOpenShift: boolean;
}

export const ShiftStatusBanner: React.FC<ShiftStatusBannerProps> = ({
  shift,
  loading,
  onOpenShift,
  canOpenShift,
}) => {
  const theme = useAppTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  if (!shift || shift.status !== 'OPEN') {
    return (
      <Card style={styles.statusCard} mode="elevated">
        <Card.Content style={styles.closedShiftContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="store-clock"
              size={64}
              color={theme.colors.primary}
            />
          </View>

          <Text variant="headlineSmall" style={styles.closedTitle}>
            {canOpenShift ? '¡Bienvenido!' : 'Turno Cerrado'}
          </Text>

          <Text variant="bodyLarge" style={styles.closedDescription}>
            {canOpenShift
              ? 'Para comenzar a operar, necesitas abrir el turno.'
              : 'El restaurante aún no ha abierto operaciones.'}
          </Text>

          {canOpenShift && (
            <View style={styles.adminInfo}>
              <MaterialCommunityIcons
                name="shield-crown"
                size={20}
                color={theme.colors.primary}
              />
              <Text variant="labelMedium" style={styles.adminText}>
                Como administrador, puedes iniciar las operaciones del turno
              </Text>
            </View>
          )}

          {canOpenShift && (
            <Button
              mode="contained"
              onPress={onOpenShift}
              style={styles.openShiftButton}
              icon="play-circle"
              contentStyle={styles.openShiftButtonContent}
            >
              Abrir Turno
            </Button>
          )}

          {!canOpenShift && (
            <View style={styles.contactInfo}>
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodyMedium" style={styles.contactText}>
                Contacta a tu administrador o gerente para iniciar operaciones
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.openStatusCard} mode="elevated">
      <Card.Content>
        <View style={styles.statusHeader}>
          <View style={styles.openIconContainer}>
            <MaterialCommunityIcons
              name="store-check"
              size={28}
              color={theme.colors.primary}
            />
          </View>
          <View style={styles.statusHeaderText}>
            <Text variant="titleMedium" style={styles.statusTitle}>
              Turno Activo
            </Text>
            <Text variant="labelMedium" style={styles.statusSubtitle}>
              {format(new Date(shift.date), "EEEE, d 'de' MMMM", {
                locale: es,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.statusInfoGrid}>
          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="counter"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="labelSmall" style={styles.infoCardLabel}>
              Turno Global
            </Text>
            <Text variant="titleMedium" style={styles.infoCardValue}>
              #{shift.globalShiftNumber}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="labelSmall" style={styles.infoCardLabel}>
              Turno de Hoy
            </Text>
            <Text variant="titleMedium" style={styles.infoCardValue}>
              #{shift.shiftNumber}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <MaterialCommunityIcons
              name="account-clock"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="labelSmall" style={styles.infoCardLabel}>
              Abierto desde
            </Text>
            <Text variant="titleMedium" style={styles.infoCardValue}>
              {format(new Date(shift.openedAt), 'HH:mm', {
                locale: es,
              })}
            </Text>
          </View>
        </View>

        <View style={styles.openedByInfo}>
          <MaterialCommunityIcons
            name="account-circle"
            size={16}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodySmall" style={styles.openedByText}>
            Abierto por {shift.openedBy.firstName} {shift.openedBy.lastName}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const createStyles = (theme: ReturnType<typeof useAppTheme>) =>
  StyleSheet.create({
    loadingContainer: {
      padding: theme.spacing.m,
      alignItems: 'center',
    },
    statusCard: {
      margin: theme.spacing.m,
      marginBottom: theme.spacing.l,
      backgroundColor: theme.colors.surface,
      elevation: 4,
    },
    closedShiftContent: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.l,
    },
    iconContainer: {
      marginBottom: theme.spacing.l,
      padding: theme.spacing.m,
      borderRadius: 100,
      backgroundColor: theme.colors.primaryContainer,
    },
    closedTitle: {
      color: theme.colors.onSurface,
      fontWeight: '700',
      marginBottom: theme.spacing.s,
      textAlign: 'center',
    },
    closedDescription: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: theme.spacing.l,
      paddingHorizontal: theme.spacing.m,
    },
    adminInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.roundness * 2,
      marginBottom: theme.spacing.l,
    },
    adminText: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '500',
    },
    openShiftButton: {
      marginTop: theme.spacing.m,
      paddingHorizontal: theme.spacing.l,
    },
    openShiftButtonContent: {
      paddingVertical: theme.spacing.s,
    },
    contactInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.roundness,
      marginTop: theme.spacing.m,
    },
    contactText: {
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    },
    openStatusCard: {
      margin: theme.spacing.m,
      marginBottom: theme.spacing.l,
      backgroundColor: theme.colors.surface,
      elevation: 2,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.m,
      marginBottom: theme.spacing.l,
    },
    openIconContainer: {
      padding: theme.spacing.s,
      borderRadius: 50,
      backgroundColor: theme.colors.primaryContainer,
    },
    statusHeaderText: {
      flex: 1,
    },
    statusTitle: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    },
    statusSubtitle: {
      color: theme.colors.onSurfaceVariant,
      textTransform: 'capitalize',
    },
    statusInfoGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: theme.spacing.s,
      marginBottom: theme.spacing.m,
    },
    infoCard: {
      flex: 1,
      backgroundColor: theme.colors.surfaceVariant,
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    infoCardLabel: {
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    infoCardValue: {
      color: theme.colors.primary,
      fontWeight: '700',
      textAlign: 'center',
    },
    openedByInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingTop: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    openedByText: {
      color: theme.colors.onSurfaceVariant,
    },
  });
