import { useState, useEffect, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { discoveryService } from '../services/discoveryService';
import { getApiClient, reinitializeApiClient } from '../services/apiClient';
import { healthMonitoringService } from '@/services/healthMonitoringService';
import { autoReconnectService } from '@/services/autoReconnectService';

/**
 * Hook para monitorear la conexión con el servidor
 *
 * IMPORTANTE: Este hook usa un estado singleton compartido para evitar múltiples
 * llamadas a discovery cuando se usa en varios componentes. Todos los componentes
 * que usen este hook compartirán el mismo estado de conexión y solo se realizará
 * una búsqueda de servidor al inicio.
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

// Singleton para el estado compartido de conexión
let sharedState = {
  isSearching: true,
  isConnected: false,
  error: null as string | null,
  serverUrl: null as string | null,
  hasWifi: true,
  isHealthy: false,
};

let listeners: Array<(state: typeof sharedState) => void> = [];
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const notifyListeners = () => {
  listeners.forEach((listener) => listener(sharedState));
};

const updateSharedState = (updates: Partial<typeof sharedState>) => {
  sharedState = { ...sharedState, ...updates };
  notifyListeners();
};

export function useServerConnection(): ServerConnectionState {
  const [state, setState] = useState(sharedState);

  // Referencias para reconexión automática
  const lastKnownUrl = useRef<string | null>(null);
  const isMounted = useRef(true);

  const updateState = useCallback((updates: Partial<typeof state>) => {
    updateSharedState(updates);
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

        // Primero intentar con la última URL conocida si existe (excepto si se fuerza nuevo discovery)
        if (!forceNew) {
          const lastUrl = await discoveryService.getLastKnownUrl();
          if (lastUrl) {
            try {
              // Verificar rápidamente si el servidor responde
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2000);

              // Asegurar que la URL termine con /
              const baseUrl = lastUrl.endsWith('/') ? lastUrl : `${lastUrl}/`;
              const response = await fetch(`${baseUrl}api/v1/health`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (response.ok) {
                // Servidor encontrado en la última URL conocida
                url = lastUrl;
                lastKnownUrl.current = url;
                await getApiClient(url);

                updateState({
                  isSearching: false,
                  isConnected: true,
                  serverUrl: url,
                  error: null,
                  isHealthy: false,
                });

                healthMonitoringService.startMonitoring();
                return;
              }
            } catch {
              // Si falla, continuar con discovery
            }
          }
        }

        // Solo hacer discovery si no hay URL conocida o si falló la verificación
        try {
          if (forceNew) {
            url = await discoveryService.forceRediscovery();
          } else {
            // Intentar obtener URL sin discovery
            url = await discoveryService.getApiUrl();
          }
        } catch (error) {
          // Si no hay URL almacenada, hacer discovery por primera vez
          url = await discoveryService.forceRediscovery();
        }

        await (forceNew ? reinitializeApiClient(url) : getApiClient(url));

        // Guardar la URL conocida para reconexión rápida
        lastKnownUrl.current = url;

        updateState({
          isSearching: false,
          isConnected: true,
          serverUrl: url,
          error: null,
          isHealthy: false, // Se actualizará cuando el health monitor responda
        });

        // Iniciar monitoreo de salud
        healthMonitoringService.startMonitoring();
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

  const retry = useCallback(() => {
    checkConnection(true);
  }, [checkConnection]);

  // Suscribirse a cambios en el estado compartido
  useEffect(() => {
    const listener = (newState: typeof sharedState) => {
      if (isMounted.current) {
        setState(newState);
      }
    };

    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  // Inicializar solo una vez globalmente
  useEffect(() => {
    isMounted.current = true;

    const initialize = async () => {
      if (!isInitialized && !initPromise) {
        isInitialized = true;
        initPromise = checkConnection();
        await initPromise;
        initPromise = null;
      } else if (initPromise) {
        // Si ya hay una inicialización en progreso, esperar
        await initPromise;
      }
    };

    initialize();

    return () => {
      isMounted.current = false;
    };
  }, [checkConnection]);

  // Escuchar cambios de red y coordinar con el servicio de reconexión
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (netState) => {
      const isNetworkConnected =
        netState.isConnected === true &&
        (netState.type === 'wifi' || netState.type === 'ethernet');

      updateState({ hasWifi: isNetworkConnected });

      if (!isNetworkConnected && sharedState.isConnected) {
        // Se perdió la conexión WiFi
        updateState({
          isConnected: false,
          isHealthy: false,
          error: 'Se perdió la conexión WiFi',
        });

        // Detener monitoreo de salud
        healthMonitoringService.stopMonitoring();

        // Detener cualquier reconexión en progreso
        autoReconnectService.stopAutoReconnect();
      } else if (isNetworkConnected && !sharedState.isConnected) {
        // Hay WiFi pero no hay conexión al servidor
        // Delegar la reconexión al servicio centralizado
        if (!autoReconnectService.getState().isReconnecting) {
          autoReconnectService.startAutoReconnect();
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updateState]);

  // Suscribirse a cambios en el estado de salud
  useEffect(() => {
    const unsubscribe = healthMonitoringService.subscribe((healthState) => {
      const wasHealthy = sharedState.isHealthy;
      const isNowHealthy = healthState.isAvailable;

      updateState({
        isHealthy: isNowHealthy,
        // Si el health check falla, actualizar el error si no hay otro error
        error:
          !isNowHealthy && !sharedState.error
            ? healthState.message || 'Servidor no responde'
            : sharedState.error,
      });

      // Si teníamos conexión pero el servidor deja de responder
      if (sharedState.isConnected && wasHealthy && !isNowHealthy) {
        // Marcar como desconectado
        updateState({
          isConnected: false,
          serverUrl: null,
          error: 'Se perdió la conexión con el servidor',
        });

        // Iniciar reconexión automática si no está ya en progreso
        if (!autoReconnectService.getState().isReconnecting) {
          setTimeout(() => {
            autoReconnectService.startAutoReconnect();
          }, 1000); // Esperar 1 segundo antes de iniciar reconexión
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updateState]);

  // Suscribirse a cambios del servicio de reconexión automática
  useEffect(() => {
    const unsubscribe = autoReconnectService.subscribe(
      async (reconnectState) => {
        // Si el servicio de reconexión encuentra una conexión exitosa
        if (reconnectState.status === 'connected') {
          try {
            // Obtener la URL actual del servicio de discovery
            const url = await discoveryService.getApiUrl();
            if (url) {
              // Actualizar la URL conocida
              lastKnownUrl.current = url;

              // Detener el monitoreo actual para reiniciarlo limpio
              healthMonitoringService.stopMonitoring();

              updateState({
                isSearching: false,
                isConnected: true,
                serverUrl: url,
                error: null,
                isHealthy: true, // Si llegó a connected, está saludable
              });

              // Asegurar que el API client esté inicializado
              await getApiClient(url);

              // Reiniciar monitoreo de salud limpio
              setTimeout(() => {
                healthMonitoringService.startMonitoring();
              }, 1000); // Pequeño delay para asegurar que todo esté listo
            }
          } catch (error) {
            // Si hay error obteniendo la URL, ignorar silenciosamente
            // El servicio de reconexión ya verificó que hay conexión
          }
        }
      },
    );

    return () => {
      unsubscribe();
    };
  }, [updateState]);

  // No limpiar el health monitoring aquí porque es compartido
  // El servicio se detendrá automáticamente cuando se pierda la conexión

  return {
    isSearching: state.isSearching,
    isConnected: state.isConnected,
    error: state.error,
    serverUrl: state.serverUrl,
    hasWifi: state.hasWifi,
    isHealthy: state.isHealthy,
    retry,
  };
}
