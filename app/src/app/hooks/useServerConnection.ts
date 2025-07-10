import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { discoveryService } from '../services/discoveryService';
import { getApiClient, reinitializeApiClient } from '../services/apiClient';

export interface ServerConnectionState {
  isSearching: boolean;
  isConnected: boolean;
  error: string | null;
  serverUrl: string | null;
  hasWifi: boolean;
  retry: () => void;
}

export function useServerConnection(): ServerConnectionState {
  const [state, setState] = useState({
    isSearching: true,
    isConnected: false,
    error: null as string | null,
    serverUrl: null as string | null,
    hasWifi: true,
  });

  // Referencias para reconexión automática
  const lastKnownUrl = useRef<string | null>(null);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const isInitialMount = useRef(true);
  const isMounted = useRef(true);

  const updateState = useCallback((updates: Partial<typeof state>) => {
    if (isMounted.current) {
      setState((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  const checkConnection = useCallback(
    async (forceNew = false) => {
      // Establecer que estamos buscando
      updateState({ isSearching: true, error: null });

      try {
        // Primero verificar el estado de la red
        const netInfo = await NetInfo.fetch();
        const isNetworkConnected =
          netInfo.isConnected &&
          (netInfo.type === 'wifi' || netInfo.type === 'ethernet');

        if (!isNetworkConnected) {
          updateState({
            isSearching: false,
            isConnected: false,
            serverUrl: null,
            hasWifi: false,
            error:
              'Asegúrate de tener el WiFi encendido y estar conectado a la red del servidor',
          });
          return;
        }

        updateState({ hasWifi: true });

        let url: string;

        if (forceNew) {
          url = await discoveryService.forceRediscovery();
          await reinitializeApiClient(url);
        } else {
          url = await discoveryService.getApiUrl();
          await getApiClient(url);
        }

        // Guardar la URL conocida para reconexión rápida
        lastKnownUrl.current = url;

        updateState({
          isSearching: false,
          isConnected: true,
          serverUrl: url,
          error: null,
        });
      } catch (err: any) {
        updateState({
          isSearching: false,
          isConnected: false,
          serverUrl: null,
          error: err.message || 'No se pudo conectar con el servidor',
        });
      }
    },
    [updateState],
  );

  // Función para verificación rápida usando la última URL conocida
  const quickCheck = useCallback(async (): Promise<boolean> => {
    // Si no tenemos URL en memoria, intentar obtener la guardada
    if (!lastKnownUrl.current) {
      const savedUrl = await discoveryService.getLastKnownUrl();
      if (savedUrl) {
        lastKnownUrl.current = savedUrl;
      } else {
        return false;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 segundo timeout

    try {
      const response = await fetch(`${lastKnownUrl.current}api/v1/discovery`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.type === 'cloudbite-api') {
          // Servidor encontrado, actualizar estado
          updateState({
            isSearching: false,
            isConnected: true,
            serverUrl: lastKnownUrl.current,
            error: null,
          });
          return true;
        }
      }
    } catch (error: any) {
      // Error esperado, servidor no disponible
    } finally {
      clearTimeout(timeoutId);
    }

    return false;
  }, [updateState]);

  const retry = useCallback(() => {
    checkConnection(true);
  }, [checkConnection]);

  // Montar y ejecutar la verificación inicial
  useEffect(() => {
    isMounted.current = true;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      checkConnection();
    }

    return () => {
      isMounted.current = false;
    };
  }, [checkConnection]);

  // Escuchar cambios de red
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (netState) => {
      const isNetworkConnected =
        netState.isConnected === true &&
        (netState.type === 'wifi' || netState.type === 'ethernet');

      updateState({ hasWifi: isNetworkConnected });

      if (!isNetworkConnected && state.isConnected) {
        // Se perdió la conexión
        updateState({
          isConnected: false,
          error: 'Se perdió la conexión WiFi',
        });

        // Cancelar cualquier intento de reconexión pendiente
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      } else if (
        isNetworkConnected &&
        !state.isConnected &&
        lastKnownUrl.current
      ) {
        // Se recuperó la red y teníamos una conexión previa

        updateState({
          isSearching: true,
          error: 'Reconectando al servidor...',
        });

        // Intentar reconexión rápida primero
        // const startTime = Date.now();
        const quickSuccess = await quickCheck();
        // const elapsed = Date.now() - startTime;

        if (!quickSuccess) {
          // Si falla la reconexión rápida, programar un redescubrimiento completo
          reconnectTimer.current = setTimeout(() => {
            if (isMounted.current) {
              checkConnection(false);
            }
          }, 2000); // Esperar 2 segundos antes de hacer discovery completo
        }
      }
    });

    return () => {
      unsubscribe();
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [state.isConnected, updateState, quickCheck, checkConnection]);

  return {
    isSearching: state.isSearching,
    isConnected: state.isConnected,
    error: state.error,
    serverUrl: state.serverUrl,
    hasWifi: state.hasWifi,
    retry,
  };
}
