import React, { useMemo } from 'react';
import { View } from 'react-native';
import { IconButton, Surface } from 'react-native-paper';
import { useAppTheme } from '../styles/theme';
import { useServerConnection } from '../hooks/useServerConnection';
import { useSnackbarStore } from '../store/snackbarStore';

export function ConnectionIndicator() {
  const theme = useAppTheme();
  const { hasWifi, isConnected, isSearching, error } = useServerConnection();
  const showSnackbar = useSnackbarStore((state) => state.showSnackbar);

  const getConnectionStatus = () => {
    if (!hasWifi) {
      return {
        icon: 'wifi-off',
        color: theme.colors.error,
        backgroundColor: theme.colors.errorContainer,
        message: 'Sin conexión WiFi',
      };
    }

    if (isSearching) {
      return {
        icon: 'wifi-sync',
        color: theme.colors.warning || theme.colors.tertiary,
        backgroundColor:
          theme.colors.warningContainer || theme.colors.tertiaryContainer,
        message: 'Reconectando...',
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

    return {
      icon: 'wifi',
      color: theme.colors.onSurfaceVariant,
      backgroundColor: 'transparent',
      message: 'Conectado',
    };
  };

  const status = getConnectionStatus();

  const handlePress = () => {
    showSnackbar({
      message: status.message,
      type: !hasWifi || !isConnected ? 'error' : 'info',
      duration: 2000,
    });
  };

  const containerStyle = useMemo(() => ({
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  }), []);

  const surfaceStyle = useMemo(() => ({
    borderRadius: 20,
    backgroundColor: status.backgroundColor,
  }), [status.backgroundColor]);

  const iconButtonStyle = useMemo(() => ({
    margin: 0,
  }), []);

  // Solo mostrar con fondo cuando hay problemas
  const showBackground = !hasWifi || !isConnected || isSearching;

  if (showBackground) {
    return (
      <View style={containerStyle}>
        <Surface style={surfaceStyle} elevation={0}>
          <IconButton
            icon={status.icon}
            iconColor={status.color}
            size={24}
            animated={isSearching}
            onPress={handlePress}
            style={iconButtonStyle}
          />
        </Surface>
      </View>
    );
  }

  // Cuando está conectado, mostrar sin fondo pero con color visible
  return (
    <View style={{ marginRight: 8 }}>
      <IconButton
        icon={status.icon}
        iconColor={theme.colors.onPrimary}
        size={24}
        onPress={handlePress}
      />
    </View>
  );
}
