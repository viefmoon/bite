import { autoReconnectService } from './autoReconnectService';
import { useSnackbarStore } from '../app/store/snackbarStore';
import { useAuthStore } from '../app/store/authStore';

class ReconnectionSnackbarService {
  private unsubscribe: (() => void) | null = null;
  private lastLogCount = 0;
  private lastStatus: string | null = null;
  private snackbarTimeouts: Map<string, NodeJS.Timeout> = new Map();

  start() {
    this.stop();

    this.unsubscribe = autoReconnectService.subscribe((state: any) => {
      const isLoggedIn = !!useAuthStore.getState().user;
      if (!isLoggedIn) return;

      if (!state.isReconnecting && state.status !== 'connected') {
        this.clearAllSnackbars();
        return;
      }

      if (state.status !== this.lastStatus) {
        this.lastStatus = state.status;
        this.showStatusSnackbar(state.status, state.attempts);
      }

      if (state.logs.length > this.lastLogCount) {
        const newLogs = state.logs.slice(
          0,
          state.logs.length - this.lastLogCount,
        );
        this.processNewLogs(newLogs);
      }

      this.lastLogCount = state.logs.length;
    });
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.clearAllSnackbars();
    this.lastLogCount = 0;
    this.lastStatus = null;
  }

  private showStatusSnackbar(status: string, attempts: number) {
    const { showSnackbar } = useSnackbarStore.getState();

    this.clearSnackbar('status');

    let message = '';
    let type: 'info' | 'error' | 'success' | 'warning' = 'info';
    let duration = 3000;

    switch (status) {
      case 'checking-network':
        message = '📡 Verificando conexión WiFi...';
        type = 'info';
        break;
      case 'checking-health':
        message = `🏥 Verificando servidor (intento #${attempts})`;
        type = 'info';
        break;
      case 'running-discovery':
        message = '🔍 Buscando servidor en la red...';
        type = 'warning';
        duration = 5000;
        break;
      case 'no-wifi':
        message = '📡 Sin conexión WiFi';
        type = 'error';
        duration = 5000;
        break;
      case 'failed':
        message = `❌ Reconexión fallida (intento #${attempts})`;
        type = 'error';
        break;
      case 'connected':
        message = '✅ ¡Conexión restablecida!';
        type = 'success';
        duration = 4000;
        break;
    }

    if (message) {
      showSnackbar({ message, type, duration });

      const timeout = setTimeout(() => {
        this.snackbarTimeouts.delete('status');
      }, duration);

      this.snackbarTimeouts.set('status', timeout);
    }
  }

  private processNewLogs(logs: string[]) {
    const { showSnackbar } = useSnackbarStore.getState();

    logs.forEach((log) => {
      if (
        log.includes('CICLO DE RECONEXIÓN') ||
        log.includes('════════') ||
        log.includes('PASO 1:') ||
        log.includes('PASO 2:') ||
        log.includes('PASO 3:')
      ) {
        return;
      }

      if (
        log.includes('ERROR:') &&
        (log.includes('Health check falló') ||
          log.includes('No se encontró servidor') ||
          log.includes('Ciclo fallido'))
      ) {
        showSnackbar({
          message: this.cleanLogMessage(log),
          type: 'error',
          duration: 4000,
        });
      } else if (
        log.includes('SUCCESS:') &&
        (log.includes('WiFi conectado') ||
          log.includes('Health check exitoso') ||
          log.includes('Servidor encontrado') ||
          log.includes('RECONEXIÓN EXITOSA'))
      ) {
        showSnackbar({
          message: this.cleanLogMessage(log),
          type: 'success',
          duration: 3000,
        });
      }
    });
  }

  private cleanLogMessage(log: string): string {
    return log
      .replace(/\[[^\]]+\]\s*(INFO|ERROR|SUCCESS):\s*/, '')
      .replace(/\s*→\s*/, ' ')
      .trim();
  }

  private clearSnackbar(key: string) {
    const timeout = this.snackbarTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.snackbarTimeouts.delete(key);
    }
  }

  private clearAllSnackbars() {
    this.snackbarTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.snackbarTimeouts.clear();
  }
}

export const reconnectionSnackbarService = new ReconnectionSnackbarService();
