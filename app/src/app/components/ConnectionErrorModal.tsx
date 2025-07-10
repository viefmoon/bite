import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Text,
  Modal,
  Portal,
  Surface,
  Icon,
  ActivityIndicator,
  IconButton,
  useTheme,
  ProgressBar,
} from 'react-native-paper';
import {
  autoReconnectService,
  ReconnectState,
} from '@/services/autoReconnectService';
import { useServerConnection } from '../hooks/useServerConnection';
import { useAuthStore } from '../store/authStore';

const { height: screenHeight } = Dimensions.get('window');

export function ConnectionErrorModal() {
  const theme = useTheme();
  const { isConnected } = useServerConnection();
  const isLoggedIn = useAuthStore((state) => !!state.user);
  const [visible, setVisible] = useState(false);
  const [reconnectState, setReconnectState] = useState<ReconnectState>(
    autoReconnectService.getState(),
  );

  // Configuración
  const SHOW_MODAL_AFTER_ATTEMPTS = 1; // Mostrar modal después de 1 intento fallido
  const SHOW_MODAL_AFTER_TIME = 5000; // O después de 5 segundos reconectando

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let hideTimeoutId: NodeJS.Timeout | null = null;

    // Suscribirse a cambios del servicio
    const unsubscribe = autoReconnectService.subscribe((state) => {
      setReconnectState(state);

      // Usar callback para obtener el valor actual de visible
      setVisible((currentVisible) => {
        // NO mostrar el modal si el usuario está logueado
        if (isLoggedIn) {
          return false;
        }

        // Lógica para mostrar el modal de forma discreta (solo en login)
        if (state.isReconnecting && !currentVisible) {
          // Caso 1: Mostrar inmediatamente si no hay WiFi
          if (state.status === 'no-wifi') {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            return true;
          }
          // Caso 2: Mostrar después de varios intentos fallidos
          else if (
            state.attempts >= SHOW_MODAL_AFTER_ATTEMPTS &&
            state.status === 'failed'
          ) {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            return true;
          }
          // Caso 3: Mostrar después de un tiempo reconectando
          else if (!timeoutId) {
            timeoutId = setTimeout(() => {
              if (!isLoggedIn) {
                setVisible(true);
              }
            }, SHOW_MODAL_AFTER_TIME);
          }
        }

        // Ocultar modal cuando se conecta exitosamente
        if (state.status === 'connected') {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          if (currentVisible) {
            // Solo mostrar éxito si el modal ya estaba visible
            if (hideTimeoutId) clearTimeout(hideTimeoutId);
            hideTimeoutId = setTimeout(() => {
              setVisible(false);
            }, 2000); // Mostrar éxito por 2 segundos
          }
        }

        return currentVisible; // Mantener el estado actual si no hay cambios
      });
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
  }, [isLoggedIn]);

  // Efecto separado para manejar cambios en la conexión
  useEffect(() => {
    // Si perdemos la conexión, iniciar reconexión automática
    if (!isConnected && !autoReconnectService.getState().isReconnecting) {
      // Pequeño delay para evitar iniciar múltiples veces
      const timer = setTimeout(() => {
        if (!isConnected) {
          autoReconnectService.startAutoReconnect();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  const getStatusInfo = () => {
    switch (reconnectState.status) {
      case 'checking-network':
        return {
          icon: 'wifi',
          title: 'Verificando red...',
          color: theme.colors.primary,
        };
      case 'checking-health':
        return {
          icon: 'server-network',
          title: 'Verificando servidor...',
          color: theme.colors.primary,
        };
      case 'running-discovery':
        return {
          icon: 'magnify-scan',
          title: 'Buscando servidor en la red...',
          color: theme.colors.tertiary,
        };
      case 'no-wifi':
        return {
          icon: 'wifi-off',
          title: 'Sin conexión WiFi',
          color: theme.colors.error,
        };
      case 'failed':
        return {
          icon: 'server-off',
          title: 'No se puede conectar',
          color: theme.colors.error,
        };
      case 'connected':
        return {
          icon: 'check-circle',
          title: '¡Conexión establecida!',
          color: theme.colors.primary,
        };
      default:
        return {
          icon: 'alert-circle',
          title: 'Conectando...',
          color: theme.colors.warning || theme.colors.tertiary,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    modal: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: '90%',
      maxWidth: 420,
      maxHeight: screenHeight * 0.75,
      borderRadius: 28,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      elevation: 24,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 20,
      backgroundColor: theme.colors.elevation.level2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
    },
    statusSection: {
      padding: 32,
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    iconContainer: {
      marginBottom: 20,
      padding: 16,
      borderRadius: 100,
      backgroundColor: theme.colors.surfaceVariant,
    },
    title: {
      fontSize: 22,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    attemptInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 24,
    },
    attemptText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onPrimaryContainer,
      marginLeft: 8,
    },
    logsSection: {
      flex: 1,
      maxHeight: 280,
      backgroundColor: theme.colors.background,
    },
    logsHeader: {
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: theme.colors.elevation.level1,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    logsTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 0.5,
    },
    logsScroll: {
      flex: 1,
      paddingHorizontal: 24,
      paddingVertical: 16,
      maxHeight: 200,
    },
    logEntry: {
      fontSize: 13,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      lineHeight: 20,
      paddingVertical: 4,
      color: theme.colors.onSurfaceVariant,
    },
    logInfo: {
      color: theme.colors.onSurfaceVariant,
    },
    logError: {
      color: theme.colors.error,
      fontWeight: '600',
    },
    logSuccess: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
  });

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          // Solo permitir cerrar si está conectado o es error de WiFi
          if (
            reconnectState.status === 'connected' ||
            reconnectState.status === 'no-wifi'
          ) {
            setVisible(false);
          }
        }}
        contentContainerStyle={styles.modal}
        dismissable={
          reconnectState.status === 'connected' ||
          reconnectState.status === 'no-wifi'
        }
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        <Surface style={styles.container} elevation={4}>
          <View style={styles.header}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}
            >
              <Icon source="wifi-sync" size={24} color={theme.colors.primary} />
              <Text style={styles.headerTitle}>Estado de Conexión</Text>
            </View>
            {(reconnectState.status === 'connected' ||
              reconnectState.status === 'no-wifi') && (
              <IconButton
                icon="close"
                size={24}
                onPress={() => setVisible(false)}
                iconColor={theme.colors.onSurfaceVariant}
              />
            )}
          </View>

          <View style={styles.statusSection}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: statusInfo.color + '20' },
              ]}
            >
              {reconnectState.isReconnecting &&
              reconnectState.status !== 'connected' ? (
                <ActivityIndicator size={56} color={statusInfo.color} />
              ) : (
                <Icon
                  source={statusInfo.icon}
                  size={56}
                  color={statusInfo.color}
                />
              )}
            </View>

            <Text style={styles.title}>{statusInfo.title}</Text>

            {reconnectState.lastError &&
              reconnectState.status !== 'connected' && (
                <Text style={styles.subtitle}>{reconnectState.lastError}</Text>
              )}

            {reconnectState.attempts > 0 &&
              reconnectState.status !== 'connected' && (
                <View style={styles.attemptInfo}>
                  <Icon
                    source="refresh"
                    size={18}
                    color={theme.colors.onPrimaryContainer}
                  />
                  <Text style={styles.attemptText}>
                    Intento #{reconnectState.attempts}
                  </Text>
                </View>
              )}

            {reconnectState.isReconnecting &&
              reconnectState.status !== 'connected' && (
                <View style={{ marginTop: 24, width: '100%' }}>
                  <ProgressBar
                    indeterminate
                    color={statusInfo.color}
                    style={{ height: 3, borderRadius: 2 }}
                  />
                </View>
              )}
          </View>

          <View style={styles.logsSection}>
            <View style={styles.logsHeader}>
              <Text style={styles.logsTitle}>REGISTRO DE ACTIVIDAD</Text>
            </View>
            <ScrollView
              style={styles.logsScroll}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              scrollEnabled={true}
            >
              {reconnectState.logs.length > 0 ? (
                <View>
                  {reconnectState.logs.map((log, index) => {
                    let logStyle = styles.logInfo;
                    if (
                      log.includes('ERROR:') ||
                      log.includes('❌') ||
                      log.includes('✗')
                    ) {
                      logStyle = styles.logError;
                    } else if (
                      log.includes('SUCCESS:') ||
                      log.includes('✅') ||
                      log.includes('✓') ||
                      log.includes('🎉')
                    ) {
                      logStyle = styles.logSuccess;
                    }

                    return (
                      <View key={`log-${index}`} style={{ marginBottom: 8 }}>
                        <Text style={[styles.logEntry, logStyle]}>{log}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                  <Icon
                    source="history"
                    size={32}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.logEntry,
                      { textAlign: 'center', opacity: 0.6, marginTop: 12 },
                    ]}
                  >
                    Iniciando proceso de reconexión...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Surface>
      </Modal>
    </Portal>
  );
}
