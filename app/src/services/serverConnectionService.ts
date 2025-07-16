import { discoveryService } from '@/app/services/discoveryService';
import { healthMonitoringService } from '@/services/healthMonitoringService';
import { autoReconnectService } from '@/services/autoReconnectService';
import EncryptedStorage from '@/app/services/secureStorageService';
import NetInfo from '@react-native-community/netinfo';

export type ConnectionMode = 'auto' | 'manual';

interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastError: string | null;
  mode: ConnectionMode;
  currentUrl: string | null;
  hasWifi: boolean;
  isHealthy: boolean;
  isSearching: boolean;
  error: string | null;
}

class ServerConnectionService {
  private state: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    lastError: null,
    mode: 'auto',
    currentUrl: null,
    hasWifi: false,
    isHealthy: false,
    isSearching: false,
    error: null,
  };

  private listeners: Array<(state: ConnectionState) => void> = [];
  private connectionPromise: Promise<void> | null = null;
  private healthUnsubscribe: (() => void) | null = null;
  private reconnectUnsubscribe: (() => void) | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;

  constructor() {
    this.loadConnectionMode();
    this.initializeListeners();
    
    setTimeout(() => {
      if (!this.state.isConnected && !this.state.isConnecting) {
        this.connect().catch(() => {});
      }
    }, 1000);
  }

  private async loadConnectionMode() {
    try {
      const savedMode = await EncryptedStorage.getItem('connection_mode') as ConnectionMode;
      if (savedMode) {
        this.state.mode = savedMode;
      }
    } catch (error) {}
  }

  private initializeListeners() {
    this.netInfoUnsubscribe = NetInfo.addEventListener((state) => {
      const hasWifi = !!state.isConnected && 
        (state.type === 'wifi' || state.type === 'ethernet');
      
      const previousHasWifi = this.state.hasWifi;
      
      // Si perdemos el WiFi, también perdemos la conexión
      if (!hasWifi && previousHasWifi) {
        this.updateState({ 
          hasWifi: false,
          isConnected: false,
          isHealthy: false,
          error: 'Sin conexión WiFi'
        });
        // Detener el monitoreo de salud cuando no hay WiFi
        healthMonitoringService.stopMonitoring();
      } 
      // Si recuperamos el WiFi y no estamos conectados, intentar reconectar
      else if (hasWifi && !previousHasWifi) {
        this.updateState({ hasWifi });
        // Intentar reconectar automáticamente
        setTimeout(() => {
          if (!this.state.isConnected && !this.state.isConnecting) {
            this.connect().catch(() => {});
          }
        }, 1000);
      } else {
        this.updateState({ hasWifi });
      }
    });

    this.healthUnsubscribe = healthMonitoringService.subscribe((healthState) => {
      const previousHealthy = this.state.isHealthy;
      this.updateState({ 
        isHealthy: healthState.isAvailable,
        error: healthState.message || this.state.error
      });
      
      if (!previousHealthy && healthState.isAvailable && this.state.hasWifi) {
        this.updateState({
          isConnected: true,
          isHealthy: true,
          error: null,
          isSearching: false
        });
      }
    });

    this.reconnectUnsubscribe = autoReconnectService.subscribe((reconnectState) => {
      this.updateState({ 
        isSearching: reconnectState.isReconnecting,
        error: reconnectState.lastError || this.state.error
      });
    });

    autoReconnectService.on('reconnected', async () => {
      const apiUrl = await discoveryService.getApiUrl();
      
      // Reinicializar el API client con la nueva URL
      const { reinitializeApiClient } = await import('@/app/services/apiClient');
      await reinitializeApiClient(apiUrl);
      
      this.updateState({
        isConnected: true,
        isConnecting: false,
        currentUrl: apiUrl,
        isHealthy: true,
        error: null,
        lastError: null,
        isSearching: false,
      });
      healthMonitoringService.startMonitoring();
    });

    healthMonitoringService.on('recovered', async () => {
      const apiUrl = await discoveryService.getApiUrl();
      
      // Reinicializar el API client con la nueva URL
      const { reinitializeApiClient } = await import('@/app/services/apiClient');
      await reinitializeApiClient(apiUrl);
      
      this.updateState({
        isConnected: true,
        isConnecting: false,
        currentUrl: apiUrl,
        isHealthy: true,
        error: null,
        lastError: null,
        isSearching: false,
      });
      
      if (!healthMonitoringService.isMonitoring()) {
        healthMonitoringService.startMonitoring();
      }
    });

    NetInfo.fetch().then((state) => {
      const hasWifi = !!state.isConnected && 
        (state.type === 'wifi' || state.type === 'ethernet');
      this.updateState({ hasWifi });
      
      // Si tenemos WiFi pero no estamos conectados, intentar conectar
      if (hasWifi && !this.state.isConnected && !this.state.isConnecting) {
        setTimeout(() => {
          this.connect().catch(() => {});
        }, 1000);
      }
    });
  }

  async setConnectionMode(mode: ConnectionMode) {
    this.state.mode = mode;
    
    // Si cambiamos a manual, actualizar la URL actual inmediatamente
    if (mode === 'manual') {
      const url = await discoveryService.getApiUrl();
      if (url) {
        this.updateState({ currentUrl: url });
      }
    }
    
    this.notifyListeners();
  }

  getConnectionMode(): ConnectionMode {
    return this.state.mode;
  }

  async connect(): Promise<void> {
    // Si ya hay una conexión en progreso, esperarla
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    
    try {
      await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async performConnection(): Promise<void> {
    this.updateState({ isConnecting: true, lastError: null });

    try {
      let apiUrl: string | null = null;

      // Intentar conectar según el modo
      switch (this.state.mode) {
        case 'auto':
          // Primero intentar con la última URL conocida
          apiUrl = await discoveryService.getLastKnownUrl();
          if (apiUrl) {
            const isHealthy = await healthMonitoringService.checkHealthWithUrl(apiUrl);
            if (!isHealthy) {
              // Si falla, intentar descubrimiento
              apiUrl = await discoveryService.discoverServer();
            }
          } else {
            // No hay URL conocida, hacer descubrimiento
            apiUrl = await discoveryService.discoverServer();
          }
          break;

        case 'manual':
          // Usar la URL configurada manualmente
          apiUrl = await discoveryService.getApiUrl();
          if (!apiUrl) {
            throw new Error('No se ha configurado una URL manual');
          }
          break;
      }

      if (!apiUrl) {
        throw new Error('No se pudo establecer conexión con el servidor');
      }

      // No sobrescribir la URL si ya está configurada manualmente
      // Solo actualizar si es modo auto
      if (this.state.mode === 'auto') {
        await discoveryService.setServerUrl(apiUrl, false);
      }
      
      // Verificar que el servidor esté respondiendo
      const isHealthy = await healthMonitoringService.checkHealthWithUrl(apiUrl);
      if (!isHealthy) {
        throw new Error('El servidor no está respondiendo correctamente');
      }

      // Iniciar monitoreo de salud
      healthMonitoringService.startMonitoring();

      // Reinicializar el API client con la nueva URL
      const { reinitializeApiClient } = await import('@/app/services/apiClient');
      await reinitializeApiClient(apiUrl);

      this.updateState({
        isConnected: true,
        isConnecting: false,
        currentUrl: apiUrl,
        isHealthy: true,
        error: null,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.updateState({
        isConnected: false,
        isConnecting: false,
        lastError: errorMessage,
        error: errorMessage,
        isHealthy: false,
      });
      throw error;
    }
  }

  async reconnect(): Promise<void> {
    return this.connect();
  }

  retry(): void {
    // Si no está conectado y hay WiFi, iniciar reconexión automática
    if (!this.state.isConnected && this.state.hasWifi) {
      autoReconnectService.startAutoReconnect();
    } else if (!this.state.hasWifi) {
      // Si no hay WiFi, actualizar el estado de error
      this.updateState({ 
        error: 'Sin conexión WiFi',
        lastError: 'Sin conexión WiFi'
      });
    }
  }

  async disconnect(): void {
    healthMonitoringService.stopMonitoring();
    autoReconnectService.stopAutoReconnect();
    this.updateState({
      isConnected: false,
      isConnecting: false,
      currentUrl: null,
      isHealthy: false,
    });
  }

  destroy() {
    if (this.healthUnsubscribe) {
      this.healthUnsubscribe();
    }
    if (this.reconnectUnsubscribe) {
      this.reconnectUnsubscribe();
    }
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
    // Limpiar los listeners de eventos
    autoReconnectService.off('reconnected');
    healthMonitoringService.off('recovered');
  }

  subscribe(listener: (state: ConnectionState) => void): () => void {
    this.listeners.push(listener);
    // Notificar inmediatamente el estado actual
    listener(this.state);

    // Retornar función para desuscribirse
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }

  getCurrentUrl(): string | null {
    return this.state.currentUrl;
  }

  private updateState(updates: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }
}

export const serverConnectionService = new ServerConnectionService();