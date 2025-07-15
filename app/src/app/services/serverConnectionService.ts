import NetInfo from '@react-native-community/netinfo';
import { discoveryService } from './discoveryService';
import { getApiClient, reinitializeApiClient } from './apiClient';
import { healthMonitoringService } from '@/services/healthMonitoringService';
import { autoReconnectService } from '@/services/autoReconnectService';

export interface ServerConnectionState {
  isSearching: boolean;
  isConnected: boolean;
  error: string | null;
  serverUrl: string | null;
  hasWifi: boolean;
  isHealthy: boolean;
}

/**
 * Servicio singleton para manejar la conexión con el servidor.
 * Se inicializa una sola vez y notifica a todos los suscriptores sobre cambios.
 */
class ServerConnectionService {
  private state: ServerConnectionState = {
    isSearching: false,
    isConnected: false,
    error: null,
    serverUrl: null,
    hasWifi: true,
    isHealthy: false,
  };

  private listeners: Array<(state: ServerConnectionState) => void> = [];
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;
  private healthUnsubscribe: (() => void) | null = null;
  private reconnectUnsubscribe: (() => void) | null = null;

  /**
   * Inicializa el servicio. Debe llamarse una sola vez al inicio de la app.
   */
  async initialize() {
    if (this.initialized || this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    await this.initPromise;
    this.initialized = true;
    this.initPromise = null;
  }

  private async _initialize() {
    // Realizar la conexión inicial
    await this.checkConnection(false);

    // Configurar listeners de red
    this.setupNetworkListener();

    // Configurar listener de salud
    this.setupHealthListener();

    // Configurar listener de reconexión
    this.setupReconnectListener();
  }

  /**
   * Limpia todos los recursos del servicio
   */
  cleanup() {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }

    if (this.healthUnsubscribe) {
      this.healthUnsubscribe();
      this.healthUnsubscribe = null;
    }

    if (this.reconnectUnsubscribe) {
      this.reconnectUnsubscribe();
      this.reconnectUnsubscribe = null;
    }

    healthMonitoringService.stopMonitoring();
    autoReconnectService.stopAutoReconnect();

    this.initialized = false;
    this.listeners = [];
  }

  /**
   * Suscribirse a cambios en el estado de conexión
   */
  subscribe(listener: (state: ServerConnectionState) => void): () => void {
    this.listeners.push(listener);

    // Notificar inmediatamente el estado actual
    listener(this.state);

    // Retornar función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Obtener el estado actual
   */
  getState(): ServerConnectionState {
    return { ...this.state };
  }

  /**
   * Forzar reconexión
   */
  async retry() {
    await this.checkConnection(true);
  }

  private updateState(updates: Partial<ServerConnectionState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private async checkConnection(forceNew = false) {
    this.updateState({ isSearching: true, error: null });

    try {
      const netInfo = await NetInfo.fetch();
      const isNetworkConnected =
        netInfo.isConnected && (netInfo.type === 'wifi' || netInfo.type === 'ethernet');

      if (!isNetworkConnected) {
        this.updateState({
          isSearching: false,
          isConnected: false,
          serverUrl: null,
          hasWifi: false,
          error: 'Asegúrate de tener el WiFi encendido y estar conectado a la red del servidor',
        });
        return;
      }

      this.updateState({ hasWifi: true });

      let url: string | null = null;

      if (!forceNew) {
        // Intenta obtener la URL guardada. getApiUrl ahora devuelve null si no es válida.
        url = await discoveryService.getApiUrl();
      }

      // Si no se encontró una URL válida o se está forzando, hacer discovery.
      if (!url) {
        url = await discoveryService.forceRediscovery();
      }

      if (!url) {
        // Si después de todo no se encontró una URL, lanzar error.
        throw new Error('No se pudo encontrar el servidor en la red local.');
      }

      // Si llegamos aquí, tenemos una URL válida.
      await (forceNew ? reinitializeApiClient(url) : getApiClient(url));

      this.updateState({
        isSearching: false,
        isConnected: true,
        serverUrl: url,
        error: null,
        isHealthy: false,
      });

      healthMonitoringService.startMonitoring();

    } catch (err: any) {
      // Si cualquier paso falla (incluyendo el discovery), reportar el error.
      this.updateState({
        isSearching: false,
        isConnected: false,
        serverUrl: null,
        error: err.message || 'No se pudo conectar con el servidor',
      });
    }
  }

  async checkSavedConnection() {
    try {
      const url = await discoveryService.getApiUrl();
      if (url && !this.state.isConnected) {
        await this.checkConnection(false);
      }
    } catch {}
  }

  private setupNetworkListener() {
    this.netInfoUnsubscribe = NetInfo.addEventListener(async (netState) => {
      const isNetworkConnected =
        netState.isConnected === true &&
        (netState.type === 'wifi' || netState.type === 'ethernet');

      this.updateState({ hasWifi: isNetworkConnected });

      if (!isNetworkConnected && this.state.isConnected) {
        // Se perdió la conexión WiFi
        this.updateState({
          isConnected: false,
          isHealthy: false,
          error: 'Se perdió la conexión WiFi',
        });

        // Detener monitoreo de salud
        healthMonitoringService.stopMonitoring();

        // Detener cualquier reconexión en progreso
        autoReconnectService.stopAutoReconnect();
      } else if (isNetworkConnected && !this.state.isConnected) {
        // Hay WiFi pero no hay conexión al servidor
        // Delegar la reconexión al servicio centralizado
        if (!autoReconnectService.getState().isReconnecting) {
          autoReconnectService.startAutoReconnect();
        }
      }
    });
  }

  private setupHealthListener() {
    this.healthUnsubscribe = healthMonitoringService.subscribe(
      (healthState) => {
        const wasHealthy = this.state.isHealthy;
        const isNowHealthy = healthState.isAvailable;

        this.updateState({
          isHealthy: isNowHealthy,
          // Si el health check falla, actualizar el error si no hay otro error
          error:
            !isNowHealthy && !this.state.error
              ? healthState.message || 'Servidor no responde'
              : this.state.error,
        });

        // Si teníamos conexión pero el servidor deja de responder
        if (this.state.isConnected && wasHealthy && !isNowHealthy) {
          // Marcar como desconectado
          this.updateState({
            isConnected: false,
            serverUrl: null,
            error: 'Se perdió la conexión con el servidor',
          });

          // Iniciar reconexión automática si no está ya en progreso
          if (!autoReconnectService.getState().isReconnecting) {
            setTimeout(() => {
              autoReconnectService.startAutoReconnect();
            }, 1000);
          }
        }
      },
    );
  }

  private setupReconnectListener() {
    this.reconnectUnsubscribe = autoReconnectService.subscribe(
      async (reconnectState) => {
        // Si el servicio de reconexión encuentra una conexión exitosa
        if (reconnectState.status === 'connected') {
          try {
            // Obtener la URL actual del servicio de discovery
            const url = await discoveryService.getApiUrl();
            if (url) {

              // Detener el monitoreo actual para reiniciarlo limpio
              healthMonitoringService.stopMonitoring();

              this.updateState({
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
              }, 1000);
            }
          } catch {}
        } else if (reconnectState.status === 'running-discovery') {
          // Actualizar el estado para mostrar que está buscando
          this.updateState({
            isSearching: true,
            error: null,
          });
        }
      },
    );
  }
}

// Exportar instancia singleton
export const serverConnectionService = new ServerConnectionService();
