import React, { useMemo, useState, useEffect } from 'react';
import { View } from 'react-native';
import { IconButton, Surface, Badge } from 'react-native-paper';
import { useAppTheme } from '../styles/theme';
import { useServerConnection } from '../hooks/useServerConnection';
import { useSnackbarStore } from '../store/snackbarStore';
import { healthMonitoringService } from '@/services/healthMonitoringService';
import { autoReconnectService } from '@/services/autoReconnectService';

export function ConnectionIndicator() {
  const theme = useAppTheme();
  const { hasWifi, isConnected, isSearching, isHealthy, error } =
    useServerConnection();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);
  const [isChecking, setIsChecking] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Suscribirse al servicio de reconexión para mostrar indicador sutil
  useEffect(() => {
    const unsubscribe = autoReconnectService.subscribe((state) => {
      setIsReconnecting(state.isReconnecting && state.attempts > 0);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getConnectionStatus = () => {
    if (!hasWifi) {
      return {
        icon: 'wifi-off',
        color: theme.colors.error,
        backgroundColor: theme.colors.errorContainer,
        message: 'Sin conexión WiFi',
      };
    }

    if (isSearching || isChecking) {
      return {
        icon: 'wifi-sync',
        color: theme.colors.warning || theme.colors.tertiary,
        backgroundColor:
          theme.colors.warningContainer || theme.colors.tertiaryContainer,
        message: isChecking
          ? 'Verificando conexión...'
          : 'Buscando servidor...',
      };
    }

    if (!isConnected) {
      return {
        icon: 'wifi-alert',
        color: theme.colors.error,
        backgroundColor: theme.colors.errorContainer,
        message: error || 'Sin conexión al servidor',
      };
    }

    // Conectado pero servidor no saludable
    if (!isHealthy) {
      return {
        icon: 'wifi-strength-2-alert',
        color: theme.colors.warning || theme.colors.tertiary,
        backgroundColor:
          theme.colors.warningContainer || theme.colors.tertiaryContainer,
        message: error || 'Servidor no responde',
      };
    }

    return {
      icon: 'wifi',
      color: theme.colors.onSurfaceVariant,
      backgroundColor: 'transparent',
      message: 'Conectado',
    };
  };

  const status = getConnectionStatus();

  const handlePress = async () => {
    // Primero mostrar explicación del estado actual
    const iconExplanation = getIconExplanation();
    showSnackbar({
      message: iconExplanation,
      type:
        !hasWifi || !isConnected ? 'error' : !isHealthy ? 'warning' : 'info',
      duration: 4000,
    });

    // Si está reconectando, mostrar información adicional
    if (isReconnecting) {
      const reconnectState = autoReconnectService.getState();
      setTimeout(() => {
        showSnackbar({
          message: `Reconexión en progreso - Intento #${reconnectState.attempts}`,
          type: 'info',
          duration: 3000,
        });
      }, 500);
    }

    // SOLO hacer health check si está conectado y no está reconectando
    if (isConnected && !isChecking && !isReconnecting) {
      setIsChecking(true);

      // Esperar un poco antes de hacer el check
      setTimeout(async () => {
        try {
          const isHealthyNow = await healthMonitoringService.forceCheck();

          showSnackbar({
            message: isHealthyNow
              ? 'Servidor funcionando correctamente ✓'
              : 'El servidor no responde ✗',
            type: isHealthyNow ? 'success' : 'error',
            duration: 3000,
          });
        } catch (error) {
          showSnackbar({
            message: 'Error al verificar el servidor',
            type: 'error',
            duration: 3000,
          });
        } finally {
          setIsChecking(false);
        }
      }, 1000);
    }

    // Si no está conectado y no está reconectando, iniciar reconexión
    if (!isConnected && !isReconnecting && hasWifi) {
      showSnackbar({
        message: 'Iniciando proceso de reconexión...',
        type: 'info',
        duration: 2000,
      });

      // Delegar la reconexión al servicio centralizado
      // Este servicio hará health checks primero y solo discovery si es necesario
      setTimeout(() => {
        autoReconnectService.startAutoReconnect();
      }, 500);
    }
  };

  const getIconExplanation = () => {
    const reconnectInfo = isReconnecting
      ? '\n🔄 Reconectando automáticamente...'
      : '';

    switch (status.icon) {
      case 'wifi-off':
        return (
          '📡 Sin WiFi - Activa el WiFi y conéctate a la red' + reconnectInfo
        );
      case 'wifi-sync':
        return '🔄 Buscando servidor en la red...' + reconnectInfo;
      case 'wifi-alert':
        return '⚠️ Sin conexión al servidor' + reconnectInfo;
      case 'wifi-strength-2-alert':
        return '⚠️ Servidor no responde' + reconnectInfo;
      case 'wifi':
        return '✅ Conectado al servidor';
      default:
        return status.message + reconnectInfo;
    }
  };

  const containerStyle = useMemo(
    () => ({
      marginRight: 8,
      borderRadius: 20,
      overflow: 'hidden',
    }),
    [],
  );

  const surfaceStyle = useMemo(
    () => ({
      borderRadius: 20,
      backgroundColor: status.backgroundColor,
    }),
    [status.backgroundColor],
  );

  const iconButtonStyle = useMemo(
    () => ({
      margin: 0,
    }),
    [],
  );

  // Solo mostrar con fondo cuando hay problemas
  const showBackground =
    !hasWifi || !isConnected || isSearching || !isHealthy || isChecking;

  if (showBackground) {
    return (
      <View style={containerStyle}>
        <Surface style={surfaceStyle} elevation={0}>
          <IconButton
            icon={status.icon}
            iconColor={status.color}
            size={24}
            animated={isSearching || isChecking}
            onPress={handlePress}
            style={iconButtonStyle}
          />
        </Surface>
        {/* Badge sutil cuando está reconectando en segundo plano */}
        {isReconnecting && !isSearching && (
          <Badge
            size={8}
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              backgroundColor: theme.colors.warning || theme.colors.tertiary,
            }}
          />
        )}
      </View>
    );
  }

  // Cuando está conectado, mostrar sin fondo pero con color visible
  return (
    <View style={{ marginRight: 8, position: 'relative' }}>
      <IconButton
        icon={status.icon}
        iconColor={theme.colors.onPrimary}
        size={24}
        onPress={handlePress}
      />
      {/* Badge sutil cuando está reconectando en segundo plano */}
      {isReconnecting && (
        <Badge
          size={8}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: theme.colors.warning || theme.colors.tertiary,
          }}
        />
      )}
    </View>
  );
}
