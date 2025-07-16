import { useState, useEffect, useCallback } from 'react';
import { serverConnectionService } from '@/services/serverConnectionService';

/**
 * Hook para monitorear la conexión con el servidor
 *
 * Este hook simplemente se suscribe al servicio singleton de conexión
 * sin realizar ninguna inicialización. La inicialización se hace
 * una sola vez al inicio de la aplicación.
 */

export interface ServerConnectionState {
  isSearching: boolean;
  isConnected: boolean;
  error: string | null;
  serverUrl: string | null;
  hasWifi: boolean;
  isHealthy: boolean;
  retry: () => void;
}

export function useServerConnection(): ServerConnectionState {
  const [state, setState] = useState(() => {
    const serviceState = serverConnectionService.getState();
    return {
      isSearching: serviceState.isSearching,
      isConnected: serviceState.isConnected,
      error: serviceState.error,
      serverUrl: serviceState.currentUrl,
      hasWifi: serviceState.hasWifi,
      isHealthy: serviceState.isHealthy,
      retry: () => {},
    };
  });

  useEffect(() => {
    // Obtener estado inicial
    const serviceState = serverConnectionService.getState();
    setState({
      isSearching: serviceState.isSearching,
      isConnected: serviceState.isConnected,
      error: serviceState.error,
      serverUrl: serviceState.currentUrl,
      hasWifi: serviceState.hasWifi,
      isHealthy: serviceState.isHealthy,
      retry: () => serverConnectionService.retry(),
    });

    // Suscribirse a cambios en el servicio
    const unsubscribe = serverConnectionService.subscribe((newState) => {
      setState({
        isSearching: newState.isSearching,
        isConnected: newState.isConnected,
        error: newState.error,
        serverUrl: newState.currentUrl,
        hasWifi: newState.hasWifi,
        isHealthy: newState.isHealthy,
        retry: () => serverConnectionService.retry(),
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const retry = useCallback(() => {
    serverConnectionService.retry();
  }, []);

  return state;
}
