import axios from 'axios';
import { serverConnectionService } from './serverConnectionService';
import { useAuthStore } from '../app/store/authStore';
import NetInfo from '@react-native-community/netinfo';
import { API_PATHS } from '../app/constants/apiPaths';

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
  private readonly CHECK_INTERVAL = 30000;
  private readonly MIN_CHECK_INTERVAL = 5000;
  private isActive: boolean = false;
  private networkListener: (() => void) | null = null;

  private constructor() {}

  static getInstance(): AudioServiceHealthChecker {
    if (!AudioServiceHealthChecker.instance) {
      AudioServiceHealthChecker.instance = new AudioServiceHealthChecker();
    }
    return AudioServiceHealthChecker.instance;
  }

  async checkHealth(force: boolean = false): Promise<AudioServiceHealthStatus> {
    const now = Date.now();

    if (!force && now - this.lastCheckTime < this.MIN_CHECK_INTERVAL) {
      return this.healthStatus;
    }

    this.lastCheckTime = now;

    try {
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

      const connectionState = serverConnectionService.getState();
      if (!connectionState.currentUrl || !connectionState.isConnected) {
        this.updateStatus({
          isAvailable: false,
          hasInternet: true,
          serviceStatus: 'error',
          message: 'Servidor no conectado',
          lastChecked: new Date(),
        });
        return this.healthStatus;
      }

      const apiUrl = connectionState.currentUrl.endsWith('/')
        ? connectionState.currentUrl.slice(0, -1)
        : connectionState.currentUrl;
      const response = await axios.get(
        `${apiUrl}${API_PATHS.AUDIO_ORDERS_HEALTH}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 5000,
        },
      );

      const { available, status, message } = response.data;

      this.updateStatus({
        isAvailable: available,
        hasInternet: true,
        serviceStatus: status,
        message,
        lastChecked: new Date(),
      });
    } catch (error) {
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

    listener(this.healthStatus);

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

    this.isActive = true;

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

    this.checkHealth();

    this.checkInterval = setInterval(() => {
      if (this.isActive) {
        this.checkHealth();
      }
    }, this.CHECK_INTERVAL);
  }

  stopPeriodicCheck() {
    this.isActive = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.networkListener) {
      this.networkListener();
      this.networkListener = null;
    }

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
