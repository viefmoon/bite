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

  // Obtener estado actual
  getState(): HealthState {
    return { ...this.state };
  }

  // Verificar si está monitoreando
  isMonitoring(): boolean {
    return this.checkInterval !== null;
  }

  // Iniciar monitoreo periódico
  startMonitoring() {
    this.stopMonitoring(); // Detener cualquier monitoreo previo

    // Reset retry count al iniciar monitoreo nuevo
    this.retryCount = 0;

    // Verificar inmediatamente
    this.checkHealth();

    // Configurar intervalo normal
    this.checkInterval = setInterval(() => {
      this.checkHealth();
    }, NETWORK_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  // Detener monitoreo
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

  // Verificar salud del backend
  async checkHealth(): Promise<boolean> {
    if (this.isChecking) {
      return this.state.isAvailable;
    }

    this.isChecking = true;

    try {
      let apiUrl: string;
      try {
        // Usar getLastKnownUrl que NO hace verificación con discovery
        const lastKnownUrl = await discoveryService.getLastKnownUrl();
        if (!lastKnownUrl) {
          throw new Error('No hay servidor configurado');
        }
        apiUrl = lastKnownUrl;
      } catch (error) {
        // Si no hay URL configurada, marcar como no disponible
        this.updateState({
          status: 'error',
          isAvailable: false,
          message: 'Servidor no configurado',
        });
        this.isChecking = false;
        return false;
      }

      // Asegurar que la URL NO termine con /
      const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
      const healthUrl = `${baseUrl}${API_PATHS.HEALTH}`;

      const response = await axios.get(healthUrl, {
        timeout: NETWORK_CONFIG.HEALTH_CHECK_TIMEOUT,
      });

      if (response.data.status === 'ok') {
        // Backend está saludable
        const wasUnavailable = !this.state.isAvailable;

        this.updateState({
          status: 'ok',
          isAvailable: true,
          message: 'Conectado al servidor',
        });

        // Si pasamos de no disponible a disponible, emitir evento adicional
        if (wasUnavailable) {
          // Emitir evento de recuperación después de un pequeño delay
          setTimeout(() => {
            this.emit('recovered');
          }, 100);
        }

        // Reset retry count en conexión exitosa
        this.retryCount = 0;

        // Limpiar retry timeout si existe
        if (this.retryTimeout) {
          clearTimeout(this.retryTimeout);
          this.retryTimeout = null;
        }

        this.isChecking = false; // Importante: marcar como no checking antes de retornar
        return true;
      } else {
        throw new Error('Backend returned unhealthy status');
      }
    } catch (error: any) {
      // Solo marcar como error si no es un problema temporal
      const isTemporaryError = this.isTemporaryError(error);

      this.updateState({
        status: 'error',
        isAvailable: false,
        message: this.getErrorMessage(error),
      });

      // Si es un error temporal y tenemos menos de 3 reintentos, programar reintento rápido
      if (isTemporaryError && this.retryCount < 3) {
        this.scheduleRetry();
      }

      this.isChecking = false;
      return false;
    }
  }

  // Programar reintento con backoff
  private scheduleRetry() {
    // Limpiar timeout existente
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    // Obtener intervalo de reintento
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

  // Detectar si es un error temporal
  private isTemporaryError(error: any): boolean {
    return (
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message?.includes('timeout') ||
      error.code === 'ECONNRESET'
    );
  }

  // Obtener mensaje de error amigable
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

  // Suscribirse a cambios
  subscribe(callback: (state: HealthState) => void): () => void {
    this.on('stateChange', callback);

    // Llamar inmediatamente con el estado actual
    callback(this.state);

    // Retornar función para desuscribirse
    return () => {
      this.off('stateChange', callback);
    };
  }

  // Verificar salud con URL específica (sin actualizar estado interno)
  async checkHealthWithUrl(apiUrl: string): Promise<boolean> {
    try {
      // Asegurar que la URL NO termine con /
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

  // Forzar verificación inmediata
  async forceCheck(): Promise<boolean> {
    this.retryCount = 0; // Reset retry count
    const result = await this.checkHealth();

    // Forzar emisión del estado actual después del check
    // Esto asegura que todos los componentes se actualicen
    this.emit('stateChange', this.state);

    return result;
  }
}

// Singleton
export const healthMonitoringService = new HealthMonitoringService();
