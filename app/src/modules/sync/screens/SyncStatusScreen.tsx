import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  List,
  Divider,
  Banner,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { syncService } from '../services/syncService';
import { SyncStatus, SyncType } from '../types/sync.types';
import { useSnackbarStore } from '@/app/store/snackbarStore';
import { useAppTheme } from '@/app/styles/theme';
import { discoveryService } from '@/app/services/discoveryService';

export const SyncStatusScreen: React.FC = () => {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>('');

  // Query para obtener el estado de sincronización
  const {
    data: syncStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['syncStatus'],
    queryFn: () => syncService.getSyncStatus(),
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  // Mutation para disparar sincronización manual
  const triggerSyncMutation = useMutation({
    mutationFn: () => syncService.triggerSync(),
    onSuccess: (data) => {
      showSnackbar({
        message: data.message,
        type: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['syncStatus'] });
    },
    onError: (error: any) => {
      showSnackbar({
        message:
          error.response?.data?.message || 'Error al iniciar sincronización',
        type: 'error',
      });
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Obtener la URL del API al cargar el componente
  React.useEffect(() => {
    discoveryService
      .getApiUrl()
      .then((url) => setApiUrl(url))
      .catch(() => setApiUrl('URL no configurada'));
  }, []);

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.COMPLETED:
        return theme.colors.success || theme.colors.primary;
      case SyncStatus.IN_PROGRESS:
      case SyncStatus.PENDING:
        return theme.colors.secondary;
      case SyncStatus.FAILED:
        return theme.colors.error;
      case SyncStatus.PARTIAL:
        return theme.colors.tertiary;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusIcon = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.COMPLETED:
        return 'check-circle';
      case SyncStatus.IN_PROGRESS:
        return 'sync';
      case SyncStatus.PENDING:
        return 'clock-outline';
      case SyncStatus.FAILED:
        return 'alert-circle';
      case SyncStatus.PARTIAL:
        return 'alert';
      default:
        return 'help-circle';
    }
  };

  const getSyncTypeLabel = (type: SyncType) => {
    switch (type) {
      case SyncType.MENU:
        return 'Menú';
      case SyncType.CONFIG:
        return 'Configuración';
      case SyncType.ORDERS:
        return 'Órdenes';
      case SyncType.CUSTOMERS:
        return 'Clientes';
      case SyncType.FULL:
        return 'Completa';
      default:
        return type;
    }
  };

  const getStatusLabel = (status: SyncStatus) => {
    switch (status) {
      case SyncStatus.COMPLETED:
        return 'Completado';
      case SyncStatus.IN_PROGRESS:
        return 'En Progreso';
      case SyncStatus.PENDING:
        return 'Pendiente';
      case SyncStatus.FAILED:
        return 'Fallido';
      case SyncStatus.PARTIAL:
        return 'Parcial';
      default:
        return status;
    }
  };

  // Estilos dinámicos basados en el tema
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: insets.bottom + 16,
    },
    centerContent: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    card: {
      marginHorizontal: 16,
      marginVertical: 8,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    rowBetween: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 4,
    },
    serverInfo: {
      paddingLeft: 8,
      marginTop: 4,
    },
    serverUrl: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      fontSize: 12,
    },
    configVar: {
      fontFamily: 'monospace',
      marginVertical: 2,
      color: theme.colors.onSurfaceVariant,
      fontSize: 13,
    },
    statusChip: {
      paddingHorizontal: 8,
    },
    errorCard: {
      borderColor: theme.colors.error,
      borderWidth: 1,
      backgroundColor: theme.colors.errorContainer,
    },
    errorTitle: {
      color: theme.colors.error,
    },
    syncButton: {
      marginTop: 8,
    },
    historyItem: {
      paddingVertical: 12,
    },
    banner: {
      backgroundColor: theme.colors.errorContainer,
    },
    emptyStateText: {
      textAlign: 'center',
      padding: 16,
      color: theme.colors.onSurfaceVariant,
    },
    sectionTitle: {
      marginTop: 8,
      marginBottom: 4,
      fontWeight: '500',
    },
    syncingContainer: {
      alignItems: 'center',
      padding: 20,
    },
    syncingText: {
      marginTop: 12,
      fontSize: 16,
    },
    textStyle: {
      color: theme.colors.onSurface,
    },
    secondaryTextStyle: {
      color: theme.colors.onSurfaceVariant,
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="bodyLarge" style={[styles.textStyle, { marginTop: 16 }]}>
          Cargando estado de sincronización...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Banner
          visible
          icon="alert"
          style={styles.banner}
          actions={[
            {
              label: 'Reintentar',
              onPress: () => refetch(),
            },
          ]}
        >
          Error al conectar con el servidor local
        </Banner>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <Card style={styles.card} mode="elevated">
        <Card.Title
          title="Estado de Conexión"
          titleStyle={styles.cardTitle}
          left={(props: any) => (
            <MaterialCommunityIcons
              {...props}
              name="cloud-check"
              size={24}
              color={theme.colors.primary}
            />
          )}
        />
        <Card.Content>
          <View style={styles.rowBetween}>
            <Text variant="bodyMedium">Backend Local</Text>
            <Chip
              icon="check-circle"
              textStyle={{ fontSize: 12 }}
              style={[
                styles.statusChip,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
            >
              Conectado
            </Chip>
          </View>
          <View style={[styles.serverInfo, { marginTop: 4 }]}>
            <Text variant="bodySmall" style={styles.serverUrl}>
              {apiUrl || 'URL no configurada'}
            </Text>
          </View>

          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <Text variant="bodyMedium">Backend Nube</Text>
            <Chip
              icon={syncStatus?.lastSync ? 'check-circle' : 'alert-circle'}
              textStyle={{ fontSize: 12 }}
              style={[
                styles.statusChip,
                {
                  backgroundColor: syncStatus?.lastSync
                    ? theme.colors.primaryContainer
                    : theme.colors.errorContainer,
                },
              ]}
            >
              {syncStatus?.lastSync ? 'Sincronizado' : 'Desconectado'}
            </Chip>
          </View>
          {syncStatus?.remoteUrl ? (
            <View style={[styles.serverInfo, { marginTop: 4 }]}>
              <Text variant="bodySmall" style={styles.serverUrl}>
                {syncStatus.remoteUrl}
              </Text>
            </View>
          ) : null}
        </Card.Content>
      </Card>

      {!syncStatus?.isConfigured ? (
        <Card style={[styles.card, styles.errorCard]} mode="elevated">
          <Card.Title
            title="Configuración Requerida"
            titleStyle={[styles.cardTitle, styles.errorTitle]}
            left={(props: any) => (
              <MaterialCommunityIcons
                {...props}
                name="alert-circle"
                size={24}
                color={theme.colors.error}
              />
            )}
          />
          <Card.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Para habilitar la sincronización, configura las siguientes
              variables en el backend:
            </Text>
            <Text variant="bodySmall" style={styles.configVar}>
              • SYNC_ENABLED=true
            </Text>
            <Text variant="bodySmall" style={styles.configVar}>
              • CLOUD_API_URL=https://tu-servidor.com
            </Text>
            <Text variant="bodySmall" style={styles.configVar}>
              • CLOUD_API_KEY=tu_api_key
            </Text>
            <Text variant="bodySmall" style={styles.configVar}>
              • SYNC_INTERVAL_MINUTES=5
            </Text>
            <Text variant="bodySmall" style={styles.configVar}>
              • SYNC_WEBSOCKET_ENABLED=true (opcional)
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Card style={styles.card} mode="elevated">
        <Card.Title
          title="Sincronización Actual"
          titleStyle={styles.cardTitle}
          left={(props: any) => (
            <MaterialCommunityIcons
              {...props}
              name={syncStatus?.isCurrentlySyncing ? 'sync' : 'sync-off'}
              size={24}
              color={
                syncStatus?.isCurrentlySyncing
                  ? theme.colors.secondary
                  : theme.colors.onSurfaceVariant
              }
            />
          )}
        />
        <Card.Content>
          {syncStatus?.isCurrentlySyncing ? (
            <View style={styles.syncingContainer}>
              <ActivityIndicator size="large" color={theme.colors.secondary} />
              <Text variant="bodyLarge" style={styles.syncingText}>
                Sincronización en progreso...
              </Text>
            </View>
          ) : (
            <View>
              {syncStatus?.lastSync ? (
                <View>
                  <View style={styles.rowBetween}>
                    <Text variant="bodyMedium" style={styles.sectionTitle}>
                      Última sincronización
                    </Text>
                    <Text variant="bodySmall" style={styles.secondaryTextStyle}>
                      {syncStatus.lastSync.completedAt
                        ? formatDistanceToNow(
                            new Date(syncStatus.lastSync.completedAt),
                            {
                              addSuffix: true,
                              locale: es,
                            },
                          )
                        : 'Nunca'}
                    </Text>
                  </View>
                  <View style={[styles.rowBetween, { marginTop: 8 }]}>
                    <Text variant="bodyMedium" style={styles.sectionTitle}>
                      Estado
                    </Text>
                    <Chip
                      icon={getStatusIcon(syncStatus.lastSync.status)}
                      textStyle={{ fontSize: 12 }}
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor:
                            getStatusColor(syncStatus.lastSync.status) + '20',
                        },
                      ]}
                    >
                      {getStatusLabel(syncStatus.lastSync.status)}
                    </Chip>
                  </View>
                  <View style={[styles.rowBetween, { marginTop: 8 }]}>
                    <Text variant="bodyMedium" style={styles.sectionTitle}>
                      Items sincronizados
                    </Text>
                    <Text variant="bodySmall" style={styles.secondaryTextStyle}>
                      {`${syncStatus.lastSync.itemsSynced} exitosos, ${syncStatus.lastSync.itemsFailed} fallidos`}
                    </Text>
                  </View>
                  {syncStatus.lastSync.duration ? (
                    <View style={[styles.rowBetween, { marginTop: 8 }]}>
                      <Text variant="bodyMedium" style={styles.sectionTitle}>
                        Duración
                      </Text>
                      <Text
                        variant="bodySmall"
                        style={styles.secondaryTextStyle}
                      >
                        {`${syncStatus.lastSync.duration}s`}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text variant="bodyMedium" style={styles.emptyStateText}>
                  No hay sincronizaciones previas
                </Text>
              )}
            </View>
          )}
        </Card.Content>
        <Card.Actions>
          <Button
            mode="contained"
            onPress={() => triggerSyncMutation.mutate()}
            loading={triggerSyncMutation.isPending}
            disabled={
              syncStatus?.isCurrentlySyncing || !syncStatus?.isConfigured
            }
            icon="sync"
            style={styles.syncButton}
            contentStyle={{ paddingHorizontal: 16 }}
          >
            Sincronizar Ahora
          </Button>
        </Card.Actions>
      </Card>

      {syncStatus?.syncHistory && syncStatus.syncHistory.length > 0 ? (
        <Card style={styles.card} mode="elevated">
          <Card.Title
            title="Historial Reciente"
            titleStyle={styles.cardTitle}
            left={(props: any) => (
              <MaterialCommunityIcons
                {...props}
                name="history"
                size={24}
                color={theme.colors.primary}
              />
            )}
          />
          <Card.Content style={{ paddingHorizontal: 0 }}>
            {syncStatus.syncHistory.slice(0, 5).map((sync, index) => (
              <React.Fragment key={sync.id}>
                <List.Item
                  title={`${getSyncTypeLabel(sync.syncType)} - ${getStatusLabel(sync.status)}`}
                  description={`${sync.itemsSynced} items • ${
                    sync.createdAt
                      ? format(new Date(sync.createdAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })
                      : ''
                  }`}
                  style={styles.historyItem}
                  titleStyle={styles.textStyle}
                  descriptionStyle={styles.secondaryTextStyle}
                  left={(props: any) => (
                    <List.Icon
                      {...props}
                      icon={getStatusIcon(sync.status)}
                      color={getStatusColor(sync.status)}
                    />
                  )}
                  right={() =>
                    sync.duration ? (
                      <Text
                        variant="bodySmall"
                        style={[
                          styles.secondaryTextStyle,
                          { alignSelf: 'center' },
                        ]}
                      >
                        {`${sync.duration}s`}
                      </Text>
                    ) : null
                  }
                />
                {index < syncStatus.syncHistory.length - 1 ? <Divider /> : null}
              </React.Fragment>
            ))}
          </Card.Content>
        </Card>
      ) : null}

      {syncStatus?.errors && syncStatus.errors.length > 0 ? (
        <Card style={[styles.card, styles.errorCard]} mode="elevated">
          <Card.Title
            title="Errores Recientes"
            titleStyle={[styles.cardTitle, styles.errorTitle]}
            left={(props: any) => (
              <MaterialCommunityIcons
                {...props}
                name="alert-circle"
                size={24}
                color={theme.colors.error}
              />
            )}
          />
          <Card.Content>
            {syncStatus.errors.map((error, index) => (
              <Text
                key={index}
                variant="bodySmall"
                style={{ color: theme.colors.error }}
              >
                {`• ${JSON.stringify(error)}`}
              </Text>
            ))}
          </Card.Content>
        </Card>
      ) : null}
    </ScrollView>
  );
};
