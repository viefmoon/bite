import React, { useEffect, useState, useRef } from 'react';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function ConnectionErrorModal() {
  const theme = useTheme();
  const { isConnected } = useServerConnection();
  const isLoggedIn = useAuthStore((state) => !!state.user);
  const [visible, setVisible] = useState(false);
  const [reconnectState, setReconnectState] = useState<ReconnectState>(
    autoReconnectService.getState(),
  );
  const [isPaused, setIsPaused] = useState(false);
  const [pausedLogs, setPausedLogs] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = autoReconnectService.subscribe((state) => {
      setReconnectState(state);
      
      if (!isLoggedIn && state.isReconnecting) {
        setVisible(true);
      }
      
      if (state.status === 'connected') {
        setTimeout(() => {
          setVisible(false);
        }, 2000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLoggedIn]);

  // Efecto para pausar los logs
  useEffect(() => {
    if (isPaused && pausedLogs.length === 0) {
      // Guardar los logs actuales cuando se pausa
      setPausedLogs([...reconnectState.logs]);
    } else if (!isPaused) {
      // Limpiar logs pausados cuando se reanuda
      setPausedLogs([]);
    }
  }, [isPaused, reconnectState.logs]);

  useEffect(() => {
    if (!isConnected && !autoReconnectService.getState().isReconnecting) {
      setTimeout(() => {
        if (!isConnected) {
          autoReconnectService.startAutoReconnect();
        }
      }, 500);
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
          color: theme.colors.tertiary,
        };
    }
  };

  const statusInfo = getStatusInfo();

  const styles = StyleSheet.create({
    modal: {
      justifyContent: 'center',
      alignItems: 'center',
      margin: 20,
    },
    container: {
      width: screenWidth - 40,
      minHeight: 400,
      maxHeight: screenHeight * 0.85,
      backgroundColor: theme.colors.surface,
      borderRadius: 24,
      overflow: 'hidden',
      elevation: 8,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.elevation.level2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
      marginLeft: 12,
    },
    statusSection: {
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    },
    attemptBadge: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginTop: 8,
    },
    attemptText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.colors.onPrimaryContainer,
    },
    logsContainer: {
      backgroundColor: theme.colors.surfaceVariant,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 16,
      overflow: 'hidden',
      minHeight: 200,
      maxHeight: 350,
    },
    logsHeader: {
      backgroundColor: theme.colors.elevation.level1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    logsTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    logsList: {
      padding: 16,
    },
    logEntry: {
      fontSize: 13,
      lineHeight: 20,
      color: theme.colors.onSurface,
      marginBottom: 6,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    logInfo: {
      color: theme.colors.onSurface,
    },
    logError: {
      color: theme.colors.error,
      fontWeight: '600',
    },
    logSuccess: {
      color: theme.colors.primary,
      fontWeight: '600',
    },
    progressContainer: {
      paddingHorizontal: 24,
      paddingBottom: 12,
    },
  });

  if (!visible) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          if (reconnectState.status === 'connected' || reconnectState.status === 'no-wifi') {
            setVisible(false);
          }
        }}
        contentContainerStyle={styles.modal}
        dismissable={reconnectState.status === 'connected' || reconnectState.status === 'no-wifi'}
      >
        <Surface style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Icon source="wifi-sync" size={24} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>Estado de Conexión</Text>
            {(reconnectState.status === 'connected' || reconnectState.status === 'no-wifi') && (
              <IconButton
                icon="close"
                size={24}
                onPress={() => setVisible(false)}
                iconColor={theme.colors.onSurfaceVariant}
              />
            )}
          </View>

          {/* Status Section */}
          <View style={styles.statusSection}>
            <Text style={styles.title}>{statusInfo.title}</Text>

            {reconnectState.lastError && reconnectState.status !== 'connected' && (
              <Text style={styles.subtitle}>{reconnectState.lastError}</Text>
            )}

            {reconnectState.attempts > 0 && reconnectState.status !== 'connected' && (
              <View style={styles.attemptBadge}>
                <Text style={styles.attemptText}>
                  Intento #{reconnectState.attempts}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          {reconnectState.isReconnecting && reconnectState.status !== 'connected' && (
            <View style={styles.progressContainer}>
              <ProgressBar 
                indeterminate 
                color={statusInfo.color}
                style={{ height: 4, borderRadius: 2 }}
              />
            </View>
          )}

          {/* Logs Section */}
          {reconnectState.logs.length > 0 && (
            <View style={styles.logsContainer}>
              <View style={styles.logsHeader}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.logsTitle}>
                    DETALLES DEL PROCESO {isPaused ? '(PAUSADO)' : ''}
                  </Text>
                  <IconButton
                    icon={isPaused ? 'play' : 'pause'}
                    size={32}
                    onPress={() => setIsPaused(!isPaused)}
                    iconColor={theme.colors.primary}
                    style={{ margin: -4 }}
                  />
                </View>
              </View>
              <ScrollView 
                ref={scrollViewRef}
                style={styles.logsList}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {(isPaused ? pausedLogs : reconnectState.logs).map((log, index) => {
                  let logStyle = [styles.logEntry, styles.logInfo];
                  
                  if (log.includes('ERROR:') || log.includes('❌') || log.includes('✗')) {
                    logStyle = [styles.logEntry, styles.logError];
                  } else if (log.includes('SUCCESS:') || log.includes('✅') || log.includes('✓') || log.includes('🎉')) {
                    logStyle = [styles.logEntry, styles.logSuccess];
                  }
                  
                  return (
                    <Text key={`log-${index}-${log.substring(0, 10)}`} style={logStyle}>
                      {log}
                    </Text>
                  );
                })}
                <View style={{ height: 10 }} />
              </ScrollView>
            </View>
          )}
        </Surface>
      </Modal>
    </Portal>
  );
}