import axios from 'axios';
import { discoveryService } from '@/app/services/discoveryService';
import EventEmitter from 'eventemitter3';

export type HealthStatus = 'ok' | 'error' | 'checking';

export interface HealthState {
  status: HealthStatus;
  isAvailable: boolean;
  lastCheck: number;
  uptime?: number;
  message?: string;
}

class HealthMonitoringService extends EventEmitter {
  private state: HealthState = {
    status: 'checking',
    isAvailable: false,
    lastCheck: 0,
  };

  private checkInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isChecking = false;

  // Configuración
  private readonly NORMAL_INTERVAL = 30000; // 30 segundos
  private readonly RETRY_INTERVALS = [5000, 10000, 20000, 30000]; // 5s, 10s, 20s, 30s
  private retryCount = 0;

  constructor() {
    super();
  }

  // Obtener estado actual
  getState(): HealthState {
    return { ...this.state };
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
    }, this.NORMAL_INTERVAL);
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
          lastCheck: Date.now(),
          message: 'Servidor no configurado',
        });
        this.isChecking = false;
        return false;
      }

      // Asegurar que la URL termine con /
      const baseUrl = apiUrl.endsWith('/') ? apiUrl : `${apiUrl}/`;
      const healthUrl = `${baseUrl}api/v1/health`;

      const response = await axios.get(healthUrl, {
        timeout: 3000, // 3 segundos de timeout
      });

      if (response.data.status === 'ok') {
        // Backend está saludable
        this.updateState({
          status: 'ok',
          isAvailable: true,
          lastCheck: Date.now(),
          uptime: response.data.uptime,
          message: 'Conectado al servidor',
        });

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
        lastCheck: Date.now(),
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
      this.RETRY_INTERVALS[
        Math.min(this.retryCount, this.RETRY_INTERVALS.length - 1)
      ];

    this.retryTimeout = setTimeout(() => {
      this.retryCount++;
      this.checkHealth();
    }, retryInterval);
  }

  // Actualizar estado y notificar
  private updateState(newState: HealthState) {
    const oldAvailable = this.state.isAvailable;
    this.state = newState;

    // Emitir evento de cambio
    this.emit('stateChange', this.state);

    // Emitir evento específico si cambió la disponibilidad
    if (oldAvailable !== newState.isAvailable) {
      this.emit('availabilityChange', newState.isAvailable);
    }
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

  // Forzar verificación inmediata
  async forceCheck(): Promise<boolean> {
    this.retryCount = 0; // Reset retry count
    return this.checkHealth();
  }
}

// Singleton
export const healthMonitoringService = new HealthMonitoringService();
