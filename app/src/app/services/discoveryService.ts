import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from '@/app/services/secureStorageService';
import { NETWORK_CONFIG } from '../constants/network';
import { API_PATHS } from '../constants/apiPaths';
import { Platform } from 'react-native';

const DISCOVERY_ENDPOINT = API_PATHS.DISCOVERY.substring(1); // Quitar / inicial
const STORAGE_KEY = 'last_known_api_url';

interface DiscoveryResponse {
  type: string;
  name: string;
  version: string;
  port: number;
  features: string[];
  timestamp: number;
  remoteUrl?: string;
  tunnelEnabled?: boolean;
}

export class DiscoveryService {
  private static instance: DiscoveryService;
  private cachedUrl: string | null = null;
  private discovering = false;
  private discoveryPromise: Promise<string | null> | null = null;
  private lastDiscoveryTime = 0;
  private logCallback: ((message: string) => void) | null = null;
  private manualUrl: string | null = null;
  private progressCallback: ((progress: { current: number; total: number; message: string }) => void) | null = null;

  private constructor() {}

  /**
   * Establece un callback para logs
   */
  setLogCallback(callback: ((message: string) => void) | null) {
    this.logCallback = callback;
  }

  /**
   * Establece un callback para el progreso del discovery
   */
  setProgressCallback(callback: ((progress: { current: number; total: number; message: string }) => void) | null) {
    this.progressCallback = callback;
  }

  private log(message: string) {
    if (this.logCallback) {
      this.logCallback(message);
    }
  }

  private updateProgress(current: number, total: number, message: string) {
    if (this.progressCallback) {
      this.progressCallback({ current, total, message });
    }
  }

  static getInstance(): DiscoveryService {
    if (!DiscoveryService.instance) {
      DiscoveryService.instance = new DiscoveryService();
    }
    return DiscoveryService.instance;
  }

  /**
   * Obtiene la URL del API desde cache o almacenamiento
   * Solo verifica si la URL almacenada sigue funcionando
   * @returns string si encuentra una URL válida, null si no encuentra ninguna
   */
  async getApiUrl(): Promise<string | null> {
    // Si hay URL manual configurada, usarla
    if (this.manualUrl) {
      return this.manualUrl;
    }

    // En web, intentar recuperar URL manual guardada
    if (Platform.OS === 'web') {
      try {
        const savedUrl = await EncryptedStorage.getItem('manual_server_url');
        if (savedUrl) {
          this.manualUrl = savedUrl;
          return savedUrl;
        }
      } catch {}
      return null;
    }

    // Si ya tenemos una URL en cache, devolverla sin verificar
    // La verificación se hace en otros lugares (health monitoring)
    if (this.cachedUrl) {
      return this.cachedUrl;
    }

    // Intentar con la última URL conocida almacenada
    try {
      const lastKnown = await EncryptedStorage.getItem(STORAGE_KEY);
      if (lastKnown) {
        this.cachedUrl = lastKnown;
        return lastKnown;
      }
    } catch {}

    // Si no hay URL válida, devolver null
    return null;
  }

  /**
   * Fuerza un nuevo descubrimiento del backend
   * IMPORTANTE: Solo debe llamarse después de múltiples health checks fallidos
   */
  async forceRediscovery(): Promise<string> {
    // Si hay un descubrimiento en progreso, esperar a que termine
    if (this.discoveryPromise && this.discovering) {
      const result = await this.discoveryPromise;
      if (result) return result;
    }

    // FORZAR nueva búsqueda - limpiar cache SIEMPRE en forceRediscovery
    await this.clearCache();

    // Verificar que no se esté llamando muy frecuentemente
    const timeSinceLastDiscovery = Date.now() - this.lastDiscoveryTime;
    if (timeSinceLastDiscovery < NETWORK_CONFIG.MIN_DISCOVERY_INTERVAL) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const discoveredUrl = await this.discoverBackend();
    if (!discoveredUrl) {
      throw new Error(
        'No se pudo encontrar el servidor CloudBite en la red local',
      );
    }

    return discoveredUrl;
  }

  async clearCache(): Promise<void> {
    this.cachedUrl = null;
    try {
      await EncryptedStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  /**
   * Obtiene la última URL conocida sin hacer discovery
   */
  async getLastKnownUrl(): Promise<string | null> {
    if (this.cachedUrl) {
      return this.cachedUrl;
    }

    try {
      const lastKnown = await EncryptedStorage.getItem(STORAGE_KEY);
      return lastKnown;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si un servidor está disponible
   */
  private async checkServer(url: string): Promise<boolean> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      NETWORK_CONFIG.DISCOVERY_TIMEOUT,
    );

    try {
      const response = await fetch(`${url}${DISCOVERY_ENDPOINT}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) return false;

      const data: DiscoveryResponse = await response.json();
      return data.type === 'cloudbite-api';
    } catch (error) {
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async discoverBackend(): Promise<string | null> {
    // Si ya hay un descubrimiento en progreso, devolver la promesa existente
    if (this.discoveryPromise && this.discovering) {
      return this.discoveryPromise;
    }

    this.lastDiscoveryTime = Date.now();
    this.discovering = true;

    // Crear nueva promesa de descubrimiento
    this.discoveryPromise = this.performDiscovery()
      .then(async (result) => {
        if (result) {
          // Usar el método unificado para guardar la URL descubierta
          await this.setServerUrl(result, false);
        }
        return result;
      })
      .finally(() => {
        this.discoveryPromise = null;
        this.discovering = false;
      });

    return this.discoveryPromise;
  }

  private async performDiscovery(): Promise<string | null> {
    try {
      // En web no podemos hacer descubrimiento
      if (Platform.OS === 'web') {
        this.log('❌ El descubrimiento automático no está disponible en web');
        return null;
      }

      // Obtener información de red
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        throw new Error('No hay conexión de red disponible');
      }

      this.log(
        `🔧 Buscando servidor en puerto ${NETWORK_CONFIG.DISCOVERY_PORT}`,
      );

      const subnets = this.detectCurrentSubnet();
      this.log(`📡 Iniciando búsqueda en redes: ${subnets.join(', ')}`);

      // Calcular total de IPs a escanear
      let totalIps = 0;
      for (const subnet of subnets) {
        totalIps += 254; // IPs de .1 a .254
      }
      this.updateProgress(0, totalIps, 'Iniciando búsqueda...');

      let globalIpsScanned = 0;

      // Probar cada subnet hasta encontrar el servidor
      for (const subnet of subnets) {
        this.log(`🔍 Escaneando red ${subnet}.*`);
        this.updateProgress(globalIpsScanned, totalIps, `Escaneando red ${subnet}.*`);
        
        const ips = this.generateIpRange(subnet);
        const chunks = this.chunkArray(
          ips,
          NETWORK_CONFIG.MAX_CONCURRENT_REQUESTS,
        );

        let totalIpsScanned = 0;

        for (let i = 0; i < chunks.length; i++) {
          const currentIps = chunks[i];

          const results = await Promise.allSettled(
            currentIps.map((ip) => this.probeServer(ip)),
          );

          totalIpsScanned += currentIps.length;
          globalIpsScanned += currentIps.length;

          // Actualizar progreso
          this.updateProgress(globalIpsScanned, totalIps, `Escaneando ${subnet}.* (${Math.round((globalIpsScanned / totalIps) * 100)}%)`);

          // Buscar si alguna petición fue exitosa
          for (let j = 0; j < results.length; j++) {
            const result = results[j];
            if (result.status === 'fulfilled' && result.value) {
              const foundIp = currentIps[j];
              this.log(`✅ ¡SERVIDOR ENCONTRADO EN ${foundIp}!`);
              this.updateProgress(globalIpsScanned, totalIps, `¡Servidor encontrado en ${foundIp}!`);
              return result.value;
            }
          }

          // Mostrar progreso cada 10 IPs
          if (totalIpsScanned % 10 === 0) {
            const lastIp = currentIps[currentIps.length - 1];
            this.log(
              `  ▶ Escaneadas ${totalIpsScanned} IPs (última: ${lastIp})`,
            );
          }
        }

        this.log(`  ❌ No encontrado en ${subnet}.*`);
      }

      return null;
    } catch (error) {
      this.log(
        `❌ Error durante el descubrimiento: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      );
      return null;
    }
  }

  /**
   * Prueba si una IP específica tiene el servidor CloudBite
   */
  private async probeServer(ip: string): Promise<string | null> {
    const url = `http://${ip}:${NETWORK_CONFIG.DISCOVERY_PORT}`;
    const fullUrl = `http://${ip}:${NETWORK_CONFIG.DISCOVERY_PORT}${API_PATHS.DISCOVERY}`;

    // Crear AbortController para timeout real
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, NETWORK_CONFIG.DISCOVERY_TIMEOUT);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.type === 'cloudbite-api') {
            this.log(`✅ ¡SERVIDOR ENCONTRADO!`);
            this.log(`📍 IP: ${ip}`);
            this.log(`🔗 URL: ${url}`);
            return url;
          }
        } catch {
          // No es el servidor que buscamos
        }
      }
    } catch {
    } finally {
      clearTimeout(timeoutId);
    }

    return null;
  }

  private detectCurrentSubnet(): string[] {
    return NETWORK_CONFIG.COMMON_SUBNETS;
  }

  /**
   * Genera un rango de IPs para escanear
   */
  private generateIpRange(subnet: string): string[] {
    const ips: string[] = [];
    for (let i = 1; i <= 254; i++) {
      ips.push(`${subnet}.${i}`);
    }
    return ips;
  }

  /**
   * Divide un array en chunks más pequeños
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Guarda la URL en almacenamiento seguro
   */
  private async saveUrl(url: string): Promise<void> {
    try {
      await EncryptedStorage.setItem(STORAGE_KEY, url);
    } catch {}
  }

  /**
   * Establece la URL del servidor y la guarda
   * @param url - La URL del servidor (null para limpiar URL manual)
   * @param isManual - Si es true, se marca como configuración manual
   */
  async setServerUrl(url: string | null, isManual: boolean = false): Promise<void> {
    if (url) {
      // Actualizar cache en memoria
      this.cachedUrl = url;
      
      // Si es manual, guardar referencia especial
      if (isManual) {
        this.manualUrl = url;
      }
      
      // Persistir en almacenamiento seguro
      await this.saveUrl(url);
    } else if (isManual) {
      // Solo limpiar manual URL si explícitamente se pide
      this.manualUrl = null;
    }
  }


  async discoverServer(): Promise<string | null> {
    return this.discoverBackend();
  }


  /**
   * Obtiene información del servidor incluyendo URL remota si está disponible
   */
  async getServerInfo(): Promise<DiscoveryResponse | null> {
    const url = await this.getApiUrl();
    if (!url) return null;

    try {
      const response = await fetch(`${url}${DISCOVERY_ENDPOINT}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data: DiscoveryResponse = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error getting server info:', error);
    }

    return null;
  }
}

// Exportar instancia singleton
export const discoveryService = DiscoveryService.getInstance();
