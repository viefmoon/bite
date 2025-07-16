import axios from 'axios';
import { serverConnectionService } from '@/app/services/serverConnectionService';
import { useAuthStore } from '@/app/store/authStore';
import NetInfo from '@react-native-community/netinfo';
import { API_PATHS } from '@/app/constants/apiPaths';

export interface AudioServiceHealthStatus {
  isAvailable: boolean;
  hasInternet: boolean;
  serviceStatus: 'ok' | 'error' | 'disabled' | 'misconfigured' | 'checking';
  message?: string;
  lastChecked: Date;
}

class AudioServiceHealthChecker {
  private static instance: AudioServiceHealthChecker;
  private healthStatus: AudioServiceHealthStatus = {
    isAvailable: false,
    hasInternet: false,
    serviceStatus: 'checking',
    lastChecked: new Date(),
  };
  private listeners: ((status: AudioServiceHealthStatus) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL = 30000; // 30 segundos
  private readonly MIN_CHECK_INTERVAL = 5000; // 5 segundos mínimo entre checks
  private isActive: boolean = false;
  private networkListener: (() => void) | null = null;

  private constructor() {
    // NO iniciar verificación automática
    // Solo escuchar cambios de conectividad cuando el servicio esté activo
  }

  static getInstance(): AudioServiceHealthChecker {
    if (!AudioServiceHealthChecker.instance) {
      AudioServiceHealthChecker.instance = new AudioServiceHealthChecker();
    }
    return AudioServiceHealthChecker.instance;
  }

  async checkHealth(force: boolean = false): Promise<AudioServiceHealthStatus> {
    const now = Date.now();

    // Evitar checks muy frecuentes
    if (!force && now - this.lastCheckTime < this.MIN_CHECK_INTERVAL) {
      return this.healthStatus;
    }

    this.lastCheckTime = now;

    try {
      // Primero verificar conexión a internet
      const netInfo = await NetInfo.fetch();
      const hasInternet =
        netInfo.isConnected && netInfo.isInternetReachable !== false;

      if (!hasInternet) {
        this.updateStatus({
          isAvailable: false,
          hasInternet: false,
          serviceStatus: 'error',
          message: 'Sin conexión a internet',
          lastChecked: new Date(),
        });
        return this.healthStatus;
      }

      // Luego verificar el servicio
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) {
        this.updateStatus({
          isAvailable: false,
          hasInternet: true,
          serviceStatus: 'error',
          message: 'Usuario no autenticado',
          lastChecked: new Date(),
        });
        return this.healthStatus;
      }

      // Obtener la URL del servicio de conexión sin provocar discovery
      const connectionState = serverConnectionService.getState();
      if (!connectionState.serverUrl || !connectionState.isConnected) {
        this.updateStatus({
          isAvailable: false,
          hasInternet: true,
          serviceStatus: 'error',
          message: 'Servidor no conectado',
          lastChecked: new Date(),
        });
        return this.healthStatus;
      }

      const apiUrl = connectionState.serverUrl.endsWith('/') 
        ? connectionState.serverUrl.slice(0, -1) 
        : connectionState.serverUrl;
      const response = await axios.get(`${apiUrl}${API_PATHS.AUDIO_ORDERS_HEALTH}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 5000,
      });

      const { available, status, message } = response.data;

      this.updateStatus({
        isAvailable: available,
        hasInternet: true,
        serviceStatus: status,
        message,
        lastChecked: new Date(),
      });
    } catch (error) {
      // Error al verificar servicio de audio en modo desarrollo

      let errorMessage = 'Servicio de voz no disponible';
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Tiempo de espera agotado';
        } else if (error.response?.status === 503) {
          errorMessage = 'Servicio temporalmente no disponible';
        } else if (error.response?.status === 404) {
          errorMessage = 'Servicio de voz no configurado';
        }
      }

      this.updateStatus({
        isAvailable: false,
        hasInternet: true,
        serviceStatus: 'error',
        message: errorMessage,
        lastChecked: new Date(),
      });
    }

    return this.healthStatus;
  }

  private updateStatus(status: AudioServiceHealthStatus) {
    this.healthStatus = status;
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.healthStatus));
  }

  subscribe(listener: (status: AudioServiceHealthStatus) => void): () => void {
    this.listeners.push(listener);

    // Notificar inmediatamente con el estado actual
    listener(this.healthStatus);

    // Retornar función para desuscribirse
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  startPeriodicCheck() {
    if (this.checkInterval || !this.listeners.length) {
      return;
    }

    // Activar el servicio
    this.isActive = true;

    // Configurar listener de red si no existe
    if (!this.networkListener) {
      this.networkListener = NetInfo.addEventListener((state) => {
        if (
          this.isActive &&
          state.isConnected !== this.healthStatus.hasInternet
        ) {
          this.checkHealth();
        }
      });
    }

    // Hacer verificación inicial
    this.checkHealth();

    // Configurar verificaciones periódicas
    this.checkInterval = setInterval(() => {
      if (this.isActive) {
        this.checkHealth();
      }
    }, this.CHECK_INTERVAL);
  }

  stopPeriodicCheck() {
    // Desactivar el servicio
    this.isActive = false;

    // Limpiar intervalo
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // Limpiar listener de red
    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }

    // Resetear estado
    this.updateStatus({
      isAvailable: false,
      hasInternet: false,
      serviceStatus: 'checking',
      message: undefined,
      lastChecked: new Date(),
    });
  }

  getStatus(): AudioServiceHealthStatus {
    return this.healthStatus;
  }
}

export const audioServiceHealth = AudioServiceHealthChecker.getInstance();
