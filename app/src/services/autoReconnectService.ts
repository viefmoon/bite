import EventEmitter from 'eventemitter3';
import { healthMonitoringService } from './healthMonitoringService';
import { discoveryService } from '@/app/services/discoveryService';
import NetInfo from '@react-native-community/netinfo';

export type ReconnectStatus =
  | 'idle'
  | 'checking-network'
  | 'checking-health'
  | 'running-discovery'
  | 'connected'
  | 'no-wifi'
  | 'failed';

export interface ReconnectState {
  status: ReconnectStatus;
  isReconnecting: boolean;
  attempts: number;
  lastError: string | null;
  logs: string[];
}

class AutoReconnectService extends EventEmitter {
  private state: ReconnectState = {
    status: 'idle',
    isReconnecting: false,
    attempts: 0,
    lastError: null,
    logs: [],
  };

  private reconnectTimer: NodeJS.Timeout | null = null;
  private isRunning = false;

  // Configuración
  private readonly HEALTH_CHECK_ATTEMPTS = 3;
  private readonly HEALTH_CHECK_INTERVAL = 2000; // 2 segundos entre checks
  private readonly CYCLE_DELAY = 10000; // 10 segundos antes de reiniciar ciclo
  private readonly MAX_LOGS = 50;

  constructor() {
    super();
  }

  // Obtener estado actual
  getState(): ReconnectState {
    return { ...this.state };
  }

  // Agregar log con timestamp
  private addLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;

    // Crear nueva array para asegurar actualización
    const newLogs = [logEntry, ...this.state.logs].slice(0, this.MAX_LOGS);
    this.state.logs = newLogs;

    // Emitir cambio completo del estado
    this.emit('stateChange', { ...this.state, logs: [...newLogs] });
  }

  // Actualizar estado y notificar
  private updateState(updates: Partial<ReconnectState>) {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  // Iniciar proceso de reconexión automática
  async startAutoReconnect() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.updateState({
      isReconnecting: true,
      attempts: 0,
      logs: [], // Limpiar logs anteriores
      lastError: null,
      status: 'idle', // Resetear estado
    });

    this.addLog('Iniciando proceso de reconexión automática', 'info');

    // Pequeño delay para asegurar que el estado se propague
    await this.delay(100);

    await this.reconnectCycle();
  }

  // Detener reconexión
  stopAutoReconnect() {
    if (!this.isRunning) return;

    this.addLog('Deteniendo proceso de reconexión', 'info');
    this.isRunning = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.updateState({
      isReconnecting: false,
      status: 'idle',
    });
  }

  // Ciclo principal de reconexión
  private async reconnectCycle() {
    while (this.isRunning) {
      this.updateState({ attempts: this.state.attempts + 1 });
      this.addLog(`════════════════════════════════`, 'info');
      this.addLog(`CICLO DE RECONEXIÓN #${this.state.attempts}`, 'info');
      this.addLog(`════════════════════════════════`, 'info');

      // 1. Verificar estado de red
      this.addLog('📡 PASO 1: Verificando WiFi...', 'info');
      const hasNetwork = await this.checkNetwork();
      if (!hasNetwork) {
        this.addLog('❌ Sin conexión WiFi. Esperando...', 'error');
        this.updateState({
          status: 'no-wifi',
          lastError: 'No hay conexión WiFi activa',
        });

        // Esperar antes de reintentar
        await this.delay(this.CYCLE_DELAY);
        continue;
      }
      this.addLog('✅ WiFi conectado', 'success');

      // 2. Intentar health checks múltiples veces
      this.addLog('🏥 PASO 2: Health Checks', 'info');
      this.addLog('Verificando servidor con health checks...', 'info');
      const healthOk = await this.tryHealthChecks();

      if (healthOk) {
        this.addLog('🎉 ¡SERVIDOR CONECTADO!', 'success');
        this.updateState({
          status: 'connected',
          isReconnecting: false,
          lastError: null,
        });
        this.isRunning = false;
        break;
      }

      // 3. Si fallan los health checks, intentar discovery
      this.addLog('🔍 PASO 3: Discovery', 'info');
      this.addLog(
        'Health checks fallaron. Buscando servidor en red...',
        'info',
      );
      const discoveryOk = await this.tryDiscovery();

      if (discoveryOk) {
        // Verificar con health check después del discovery
        this.addLog('📍 Servidor encontrado. Verificando...', 'info');
        const postDiscoveryHealth = await this.tryHealthChecks(1); // Solo 1 intento

        if (postDiscoveryHealth) {
          this.addLog('🎉 ¡RECONEXIÓN EXITOSA!', 'success');
          this.updateState({
            status: 'connected',
            isReconnecting: false,
            lastError: null,
          });
          this.isRunning = false;
          break;
        } else {
          // Si el health check falla después del discovery, el servidor fue encontrado pero no responde
          this.addLog('❌ Servidor encontrado pero no responde', 'error');
        }
      }

      // 4. Si todo falla, esperar y reiniciar ciclo
      this.addLog(
        `❌ Ciclo fallido. Esperando ${this.CYCLE_DELAY / 1000}s...`,
        'error',
      );
      this.updateState({
        status: 'failed',
        lastError: 'No se pudo establecer conexión con el servidor',
      });

      await this.delay(this.CYCLE_DELAY);
    }
  }

  // Verificar estado de red
  private async checkNetwork(): Promise<boolean> {
    this.updateState({ status: 'checking-network' });

    try {
      const netInfo = await NetInfo.fetch();
      const hasWifi =
        netInfo.isConnected &&
        (netInfo.type === 'wifi' || netInfo.type === 'ethernet');

      return hasWifi;
    } catch (error) {
      this.addLog('Error al verificar estado de red', 'error');
      return false;
    }
  }

  // Intentar health checks múltiples veces
  private async tryHealthChecks(
    maxAttempts = this.HEALTH_CHECK_ATTEMPTS,
  ): Promise<boolean> {
    this.updateState({ status: 'checking-health' });

    for (let i = 1; i <= maxAttempts; i++) {
      this.addLog(`  → Health check ${i}/${maxAttempts}...`, 'info');

      try {
        const isHealthy = await healthMonitoringService.forceCheck();

        if (isHealthy) {
          this.addLog('  ✓ Health check exitoso', 'success');
          return true;
        } else {
          this.addLog('  ✗ Health check falló', 'error');
        }
      } catch (error: any) {
        this.addLog('  ✗ Health check falló', 'error');
      }

      // Esperar antes del siguiente intento (excepto el último)
      if (i < maxAttempts) {
        this.addLog(
          `  ⏳ Esperando ${this.HEALTH_CHECK_INTERVAL / 1000}s...`,
          'info',
        );
        await this.delay(this.HEALTH_CHECK_INTERVAL);
      }
    }

    this.addLog('  ❌ Todos los health checks fallaron', 'error');
    return false;
  }

  // Intentar discovery
  private async tryDiscovery(): Promise<boolean> {
    this.updateState({ status: 'running-discovery' });

    try {
      this.addLog('  → Iniciando escaneo de red...', 'info');
      this.addLog('  → Buscando servidor en puerto 3737...', 'info');
      const url = await discoveryService.forceRediscovery();

      if (url) {
        this.addLog(`  ✓ ¡Servidor encontrado!`, 'success');
        this.addLog(`  📍 URL: ${url}`, 'success');
        return true;
      } else {
        this.addLog('  ✗ No se encontró servidor en la red', 'error');
        return false;
      }
    } catch (error: any) {
      this.addLog('  ✗ Error al buscar servidor', 'error');
      return false;
    }
  }

  // Utilidad para delay
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.reconnectTimer = setTimeout(resolve, ms);
    });
  }

  // Suscribirse a cambios
  subscribe(callback: (state: ReconnectState) => void): () => void {
    this.on('stateChange', callback);

    // Llamar inmediatamente con el estado actual
    callback(this.state);

    // Retornar función para desuscribirse
    return () => {
      this.off('stateChange', callback);
    };
  }

  // Limpiar logs
  clearLogs() {
    this.updateState({ logs: [] });
    this.addLog('Logs limpiados', 'info');
  }
}

// Singleton
export const autoReconnectService = new AutoReconnectService();
