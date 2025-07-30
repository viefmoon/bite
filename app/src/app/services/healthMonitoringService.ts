import axios from 'axios';
import { discoveryService } from '@/app/services/discoveryService';
import EventEmitter from 'eventemitter3';
import { NETWORK_CONFIG } from '@/app/constants/network';
import { API_PATHS } from '@/app/constants/apiPaths';

export type HealthStatus = 'ok' | 'error' | 'checking';

export interface HealthState {
  status: HealthStatus;
  isAvailable: boolean;
  message?: string;
}

class HealthMonitoringService extends EventEmitter {
  private state: HealthState = {
    status: 'checking',
    isAvailable: false,
  };

  private checkInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isChecking = false;
  private retryCount = 0;

  constructor() {
    super();
  }

  getState(): HealthState {
    return { ...this.state };
  }

  isMonitoring(): boolean {
    return this.checkInterval !== null;
  }

  startMonitoring() {
    this.stopMonitoring();

    this.retryCount = 0;

    this.checkHealth();

    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, NETWORK_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  async checkHealth(): Promise<boolean> {
    if (this.isChecking) {
      return this.state.isAvailable;
    }

    this.isChecking = true;

    try {
      let apiUrl: string;
      try {
        const lastKnownUrl = await discoveryService.getLastKnownUrl();
        if (!lastKnownUrl) {
          throw new Error('No hay servidor configurado');
        }
        apiUrl = lastKnownUrl;
      } catch (error) {
        this.updateState({
          status: 'error',
          isAvailable: false,
          message: 'Servidor no configurado',
        });
        this.isChecking = false;
        return false;
      }

      const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const healthUrl = `${baseUrl}${API_PATHS.HEALTH}`;

      const response = await axios.get(healthUrl, {
        timeout: NETWORK_CONFIG.HEALTH_CHECK_TIMEOUT,
      });

      if (response.data.status === 'ok') {
        const wasUnavailable = !this.state.isAvailable;

        this.updateState({
          status: 'ok',
          isAvailable: true,
          message: 'Conectado al servidor',
        });

        if (wasUnavailable) {
          setTimeout(() => {
            this.emit('recovered');
          }, 100);
        }

        this.retryCount = 0;

        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
          this.retryTimeout = null;
        }

        this.isChecking = false;
        return true;
      } else {
        throw new Error('Backend returned unhealthy status');
      }
    } catch (error: any) {
      const isTemporaryError = this.isTemporaryError(error);

      this.updateState({
        status: 'error',
        isAvailable: false,
        message: this.getErrorMessage(error),
      });

      if (isTemporaryError && this.retryCount < 3) {
        this.scheduleRetry();
      }

      this.isChecking = false;
      return false;
    }
  }

  private scheduleRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    const retryInterval =
      NETWORK_CONFIG.HEALTH_RETRY_INTERVALS[
        Math.min(
          this.retryCount,
          NETWORK_CONFIG.HEALTH_RETRY_INTERVALS.length - 1,
        )
      ];

    this.retryTimeout = setTimeout(() => {
      this.retryCount++;
      this.checkHealth();
    }, retryInterval);
  }

  private updateState(newState: HealthState) {
    this.state = newState;
    this.emit('stateChange', this.state);
  }

  private isTemporaryError(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('timeout') ||
      error.code === 'ECONNRESET'
    );
  }

  private getErrorMessage(error: any): string {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return 'Tiempo de espera agotado';
    }
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return 'No se puede conectar al servidor';
    }
    if (error.message?.includes('No API URL')) {
      return 'Servidor no encontrado';
    }
    if (error.message?.includes('Servidor no configurado')) {
      return 'Servidor no configurado';
    }
    return 'Error de conexión';
  }

  subscribe(callback: (state: HealthState) => void): () => void {
    this.on('stateChange', callback);

    callback(this.state);

    return () => {
      this.off('stateChange', callback);
    };
  }

  async checkHealthWithUrl(apiUrl: string): Promise<boolean> {
    try {
      const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const healthUrl = `${baseUrl}${API_PATHS.HEALTH}`;

      const response = await axios.get(healthUrl, {
        timeout: NETWORK_CONFIG.HEALTH_CHECK_TIMEOUT,
      });

      return response.data.status === 'ok';
    } catch (error) {
      return false;
    }
  }

  async forceCheck(): Promise<boolean> {
    this.retryCount = 0;
    const result = await this.checkHealth();

    this.emit('stateChange', this.state);

    return result;
  }
}

export const healthMonitoringService = new HealthMonitoringService();
