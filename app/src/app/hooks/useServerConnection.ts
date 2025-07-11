import { useState, useEffect, useCallback } from 'react';
import { serverConnectionService } from '../services/serverConnectionService';

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
  const [state, setState] = useState(serverConnectionService.getState());

  useEffect(() => {
    // Suscribirse a cambios en el servicio
    const unsubscribe = serverConnectionService.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const retry = useCallback(() => {
    serverConnectionService.retry();
  }, []);

  return {
    ...state,
    retry,
  };
}
