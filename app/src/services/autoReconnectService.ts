import EventEmitter from 'eventemitter3';
import { healthMonitoringService } from './healthMonitoringService';
import { discoveryService } from '../app/services/discoveryService';
import NetInfo from '@react-native-community/netinfo';
import { NETWORK_CONFIG } from '../app/constants/network';

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
  private readonly MAX_LOGS = 50;

  constructor() {
    super();
  }

  getState(): ReconnectState {
    return { ...this.state };
  }

  private addLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;

    const newLogs = [logEntry, ...this.state.logs].slice(0, this.MAX_LOGS);
    this.state.logs = newLogs;

    this.emit('stateChange', { ...this.state, logs: [...newLogs] });
  }

  private updateState(updates: Partial<ReconnectState>) {
    this.state = { ...this.state, ...updates };
    this.emit('stateChange', this.state);
  }

  async startAutoReconnect() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.updateState({
      isReconnecting: true,
      attempts: 0,
      logs: [],
      lastError: null,
      status: 'idle',
    });

    this.addLog('Iniciando proceso de reconexión automática', 'info');

    await this.delay(100);

    await this.reconnectCycle();
  }

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

  private async reconnectCycle() {
    while (this.isRunning) {
      this.updateState({ attempts: this.state.attempts + 1 });
      this.addLog(`CICLO DE RECONEXIÓN #${this.state.attempts}`, 'info');

      const hasNetwork = await this.checkNetwork();
      if (!hasNetwork) {
        this.addLog('❌ Sin conexión WiFi. Esperando...', 'error');
        this.updateState({
          status: 'no-wifi',
          lastError: 'No hay conexión WiFi activa',
        });

        await this.delay(NETWORK_CONFIG.RECONNECT_CYCLE_DELAY);
        continue;
      }
      this.addLog('✅ WiFi conectado', 'success');

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

        setTimeout(() => {
          this.emit('reconnected');
        }, 100);

        break;
      }

      this.addLog(
        'Health checks fallaron. Buscando servidor en red...',
        'info',
      );
      const discoveryOk = await this.tryDiscovery();

      if (discoveryOk) {
        this.addLog('📍 Servidor encontrado. Verificando...', 'info');
        const postDiscoveryHealth = await this.tryHealthChecks();

        if (postDiscoveryHealth) {
          this.addLog('🎉 ¡RECONEXIÓN EXITOSA!', 'success');
          this.updateState({
            status: 'connected',
            isReconnecting: false,
            lastError: null,
          });
          this.isRunning = false;

          setTimeout(() => {
            this.emit('reconnected');
          }, 100);

          break;
        } else {
          this.addLog('❌ Servidor encontrado pero no responde', 'error');
        }
      }

      this.addLog(
        `❌ Ciclo fallido. Esperando ${NETWORK_CONFIG.RECONNECT_CYCLE_DELAY / 1000}s...`,
        'error',
      );
      this.updateState({
        status: 'failed',
        lastError: 'No se pudo establecer conexión con el servidor',
      });

      await this.delay(NETWORK_CONFIG.RECONNECT_CYCLE_DELAY);
    }
  }

  private async checkNetwork(): Promise<boolean> {
    this.updateState({ status: 'checking-network' });

    try {
      const netInfo = await NetInfo.fetch();
      const hasWifi =
        !!netInfo.isConnected &&
        (netInfo.type === 'wifi' || netInfo.type === 'ethernet');

      return hasWifi;
    } catch (error) {
      this.addLog('Error al verificar estado de red', 'error');
      return false;
    }
  }

  private async tryHealthChecks(
    maxAttempts: number = NETWORK_CONFIG.HEALTH_CHECK_ATTEMPTS,
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
      } catch (error: unknown) {
        this.addLog('  ✗ Health check falló', 'error');
      }

      if (i < maxAttempts) {
        this.addLog(`  ⏳ Esperando 2s...`, 'info');
        await this.delay(2000);
      }
    }

    this.addLog('  ❌ Todos los health checks fallaron', 'error');
    return false;
  }

  private async tryDiscovery(): Promise<boolean> {
    this.updateState({ status: 'running-discovery' });

    discoveryService.setLogCallback((message: string) => {
      this.addLog(`  ${message}`, 'info');
    });

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error al buscar servidor';
      this.addLog(`  ✗ Error: ${errorMessage}`, 'error');
      return false;
    } finally {
      discoveryService.setLogCallback(null);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.reconnectTimer = setTimeout(resolve, ms);
    });
  }

  subscribe(callback: (state: ReconnectState) => void): () => void {
    this.on('stateChange', callback);

    callback(this.state);

    return () => {
      this.off('stateChange', callback);
    };
  }
}

export const autoReconnectService = new AutoReconnectService();
