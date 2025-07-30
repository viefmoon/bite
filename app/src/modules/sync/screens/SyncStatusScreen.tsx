import React, { useState } from 'react';
import { ScrollView, RefreshControl, View, StyleSheet } from 'react-native';
import {
  Card,
  List,
  Text,
  ActivityIndicator,
  Divider,
  Icon,
  Chip,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { syncService } from '../services/syncService';
import {
  SyncActivityType,
  SyncActivityTypeEnum,
  SYNC_TYPE_LABELS,
  SYNC_DIRECTION_LABELS,
} from '../schema/sync.schema';
import { useSnackbarStore } from '@/app/stores/snackbarStore';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';

export function SyncStatusScreen() {
  const theme = useAppTheme();
  const { isTablet } = useResponsive();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [refreshing, setRefreshing] = useState(false);

  const contentPadding = isTablet ? theme.spacing.l : theme.spacing.m;
  const {
    data: syncStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => syncService.getSyncStatus(),
    refetchInterval: 30000,
  });
  const {
    data: syncActivity,
    isLoading: isLoadingActivity,
    error: activityError,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ['sync-activity'],
    queryFn: () => syncService.getSyncActivity(20),
    refetchInterval: 30000,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchStatus(), refetchActivity()]);
    } catch (error) {
      showSnackbar({
        message: 'Error al actualizar información',
        type: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: es,
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getActivityIcon = (type: SyncActivityType) => {
    switch (type) {
      case SyncActivityTypeEnum.PULL_CHANGES:
        return 'cloud-download';
      case SyncActivityTypeEnum.RESTAURANT_DATA:
        return 'store';
      case SyncActivityTypeEnum.ORDER_STATUS:
        return 'check-circle';
      default:
        return 'sync';
    }
  };

  const getStatusColor = (success: boolean) => {
    return success ? theme.colors.success : theme.colors.error;
  };

  const styles = React.useMemo(
    () => createStyles(theme, isTablet),
    [theme, isTablet],
  );

  if (isLoadingStatus || isLoadingActivity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (statusError || activityError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon source="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>
            Error al cargar información de sincronización
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { padding: contentPadding },
          isTablet && styles.scrollContentTablet,
        ]}
      >
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Estado del Servicio"
            titleVariant="headlineSmall"
            left={(props) => <Icon {...props} source="information" />}
          />
          <Card.Content>
            <List.Item
              title="Sincronización"
              titleStyle={styles.listItemTitle}
              description={syncStatus?.enabled ? 'Habilitada' : 'Deshabilitada'}
              descriptionStyle={styles.listItemDescription}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={syncStatus?.enabled ? 'check-circle' : 'close-circle'}
                  color={
                    syncStatus?.enabled
                      ? theme.colors.success
                      : theme.colors.error
                  }
                />
              )}
            />
            <List.Item
              title="WebSocket"
              titleStyle={styles.listItemTitle}
              description={
                syncStatus?.webSocketEnabled
                  ? syncStatus?.webSocketConnected
                    ? 'Conectado'
                    : syncStatus?.webSocketFailed
                      ? 'Conexión fallida'
                      : 'Intentando conectar...'
                  : 'Deshabilitado'
              }
              descriptionStyle={[
                styles.listItemDescription,
                syncStatus?.webSocketFailed && { color: theme.colors.error },
              ]}
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    syncStatus?.webSocketFailed
                      ? 'access-point-off'
                      : 'access-point'
                  }
                  color={
                    syncStatus?.webSocketConnected
                      ? theme.colors.success
                      : syncStatus?.webSocketFailed
                        ? theme.colors.error
                        : syncStatus?.webSocketEnabled
                          ? theme.colors.warning
                          : theme.colors.outline
                  }
                />
              )}
            />
            {syncStatus?.remoteUrl && (
              <List.Item
                title="Servidor Remoto"
                titleStyle={styles.listItemTitle}
                description={syncStatus.remoteUrl}
                descriptionStyle={styles.listItemDescription}
                left={(props) => <List.Icon {...props} icon="server" />}
              />
            )}
            <List.Item
              title="Modo"
              titleStyle={styles.listItemTitle}
              description="Pull (bajo demanda)"
              descriptionStyle={styles.listItemDescription}
              left={(props) => <List.Icon {...props} icon="download" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Actividad Reciente"
            titleVariant="headlineSmall"
            subtitle={`Últimas ${syncActivity?.length || 0} sincronizaciones`}
            left={(props) => <Icon {...props} source="history" />}
          />
          <Card.Content>
            {syncActivity && syncActivity.length > 0 ? (
              syncActivity.map((activity, index) => (
                <React.Fragment key={activity.id}>
                  <Surface
                    style={[
                      styles.activityItem,
                      !activity.success && styles.activityItemError,
                    ]}
                    elevation={0}
                  >
                    <View style={styles.activityHeader}>
                      <View style={styles.activityLeft}>
                        <Icon
                          source={getActivityIcon(activity.type)}
                          size={24}
                          color={getStatusColor(activity.success)}
                        />
                        <View style={styles.activityInfo}>
                          <Text
                            variant="bodyMedium"
                            style={styles.activityType}
                          >
                            {SYNC_TYPE_LABELS[activity.type]}
                          </Text>
                          <Text variant="bodySmall" style={styles.activityTime}>
                            {formatTimestamp(activity.timestamp)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.activityRight}>
                        <Chip
                          compact
                          mode="flat"
                          textStyle={[
                            styles.chipText,
                            {
                              color:
                                activity.direction === 'IN'
                                  ? theme.colors.onInfoContainer
                                  : theme.colors.onSuccessContainer,
                            },
                          ]}
                          style={[
                            styles.directionChip,
                            activity.direction === 'IN'
                              ? styles.chipIn
                              : styles.chipOut,
                          ]}
                        >
                          {SYNC_DIRECTION_LABELS[activity.direction]}
                        </Chip>
                        <Icon
                          source={activity.success ? 'check' : 'close'}
                          size={20}
                          color={getStatusColor(activity.success)}
                        />
                      </View>
                    </View>
                  </Surface>
                  {index < syncActivity.length - 1 && (
                    <Divider style={styles.divider} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon
                  source="cloud-off-outline"
                  size={48}
                  color={theme.colors.outline}
                />
                <Text
                  variant="bodyMedium"
                  style={[styles.emptyText, { color: theme.colors.outline }]}
                >
                  No hay actividad reciente
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.infoCard]} mode="contained">
          <Card.Content>
            <View style={styles.infoRow}>
              <Icon
                source="information-outline"
                size={20}
                color={theme.colors.onInfoContainer}
              />
              <Text variant="bodySmall" style={styles.infoText}>
                La sincronización se ejecuta automáticamente cuando hay cambios
                pendientes. No es necesaria ninguna acción manual.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  theme: ReturnType<typeof useAppTheme>,
  isTablet: boolean,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: theme.spacing.xl,
    },
    scrollContentTablet: {
      maxWidth: 800,
      alignSelf: 'center',
      width: '100%',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: theme.spacing.m,
      color: theme.colors.onSurfaceVariant,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    errorText: {
      marginTop: theme.spacing.m,
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
    },
    card: {
      marginBottom: theme.spacing.m,
      elevation: 2,
    },
    listItemTitle: {
      fontSize: isTablet ? 16 : 14,
      color: theme.colors.onSurface,
    },
    listItemDescription: {
      fontSize: isTablet ? 14 : 12,
      color: theme.colors.onSurfaceVariant,
    },
    activityItem: {
      padding: theme.spacing.m,
      borderRadius: theme.roundness,
      marginVertical: theme.spacing.xs,
      backgroundColor: theme.colors.surfaceVariant,
    },
    activityItemError: {
      backgroundColor: theme.colors.errorContainer,
    },
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    activityLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    activityInfo: {
      marginLeft: theme.spacing.m,
      flex: 1,
    },
    activityType: {
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    activityTime: {
      opacity: 0.7,
      marginTop: 2,
      color: theme.colors.onSurfaceVariant,
    },
    activityRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.s,
    },
    directionChip: {
      height: 24,
    },
    chipText: {
      fontSize: isTablet ? 12 : 11,
      marginVertical: 0,
      marginHorizontal: theme.spacing.s,
    },
    chipIn: {
      backgroundColor: theme.colors.infoContainer,
    },
    chipOut: {
      backgroundColor: theme.colors.successContainer,
    },
    divider: {
      marginVertical: theme.spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    emptyText: {
      marginTop: theme.spacing.m,
    },
    infoCard: {
      backgroundColor: theme.colors.infoContainer,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    infoText: {
      marginLeft: theme.spacing.s,
      flex: 1,
      lineHeight: 20,
      color: theme.colors.onInfoContainer,
    },
  });
