import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';
import { Platform } from 'react-native';

const DISCOVERY_PORT = 3737;
const DISCOVERY_ENDPOINT = 'api/v1/discovery'; // Sin la barra inicial
const STORAGE_KEY = 'last_known_api_url';
const DISCOVERY_TIMEOUT = 1000; // 1 segundo por IP
const MAX_CONCURRENT_REQUESTS = 30; // Procesar 30 IPs en paralelo

interface DiscoveryResponse {
  type: string;
  name: string;
  version: string;
  port: number;
  features: string[];
  timestamp: number;
}

export class DiscoveryService {
  private static instance: DiscoveryService;
  private cachedUrl: string | null = null;
  private discovering = false;
  private discoveryPromise: Promise<string | null> | null = null;
  private lastDiscoveryTime = 0;
  private MIN_DISCOVERY_INTERVAL = 10000; // 10 segundos mínimo entre descubrimientos

  private constructor() {}

  static getInstance(): DiscoveryService {
    if (!DiscoveryService.instance) {
      DiscoveryService.instance = new DiscoveryService();
    }
    return DiscoveryService.instance;
  }

  /**
   * Obtiene la URL del API desde cache o almacenamiento
   * Solo verifica si la URL almacenada sigue funcionando
   */
  async getApiUrl(): Promise<string> {
    // Si ya tenemos una URL en cache, verificar que siga funcionando
    if (this.cachedUrl) {
      // Hacer una verificación rápida
      if (await this.checkServer(this.cachedUrl)) {
        return this.cachedUrl;
      }
      // Si falló, limpiar cache
      this.cachedUrl = null;
    }

    // Intentar con la última URL conocida almacenada
    try {
      const lastKnown = await EncryptedStorage.getItem(STORAGE_KEY);
      if (lastKnown) {
        // Verificar si sigue funcionando
        if (await this.checkServer(lastKnown)) {
          this.cachedUrl = lastKnown;
          return lastKnown;
        }
      }
    } catch (error) {
      // Ignorar error silenciosamente
    }

    // Si no hay URL conocida o no funciona, lanzar error
    throw new Error(
      'No hay servidor configurado. Es necesario ejecutar discovery.',
    );
  }

  /**
   * Fuerza un nuevo descubrimiento del backend
   * IMPORTANTE: Solo debe llamarse después de múltiples health checks fallidos
   */
  async forceRediscovery(): Promise<string> {
    // Si hay un descubrimiento en progreso, esperar a que termine y devolver su resultado
    if (this.discoveryPromise) {
      try {
        const result = await this.discoveryPromise;
        if (result) return result;
      } catch (error) {
        // Si el discovery anterior falló, intentar uno nuevo
      }
    }

    // Verificar que no se esté llamando muy frecuentemente
    const now = Date.now();
    const timeSinceLastDiscovery = now - this.lastDiscoveryTime;
    if (
      timeSinceLastDiscovery < this.MIN_DISCOVERY_INTERVAL &&
      this.cachedUrl
    ) {
      // Si tenemos una URL cacheada y no ha pasado suficiente tiempo, devolverla
      return this.cachedUrl;
    }

    // Limpiar cache para forzar nueva búsqueda
    this.cachedUrl = null;
    try {
      await EncryptedStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignorar error
    }

    const discoveredUrl = await this.discoverBackend();
    if (!discoveredUrl) {
      throw new Error(
        'No se pudo encontrar el servidor CloudBite en la red local',
      );
    }

    return discoveredUrl;
  }

  /**
   * Limpia el cache y el almacenamiento (útil para forzar nuevo discovery)
   */
  async clearCache(): Promise<void> {
    this.cachedUrl = null;
    try {
      await EncryptedStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignorar error
    }
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
    const timeoutId = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT);

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

  /**
   * Descubre el backend escaneando la red local
   */
  private async discoverBackend(): Promise<string | null> {
    // Si ya hay un descubrimiento en progreso, devolver la promesa existente
    if (this.discoveryPromise && this.discovering) {
      return this.discoveryPromise;
    }

    // Actualizar timestamp
    this.lastDiscoveryTime = Date.now();

    // Crear nueva promesa de descubrimiento
    this.discoveryPromise = this.performDiscovery()
      .then(async (result) => {
        if (result) {
          this.cachedUrl = result;
          await this.saveUrl(result);
        }
        return result;
      })
      .finally(() => {
        // Limpiar estado al terminar
        this.discoveryPromise = null;
        this.discovering = false;
      });

    return this.discoveryPromise;
  }

  private async performDiscovery(): Promise<string | null> {
    this.discovering = true;
    try {
      // Obtener información de red
      const netInfo = await NetInfo.fetch();

      if (!netInfo.isConnected) {
        throw new Error('No hay conexión de red disponible');
      }

      // Detectar subnet actual basándonos en pruebas rápidas
      const subnet = await this.detectCurrentSubnet();

      const ips = this.generateIpRange(subnet);
      const chunks = this.chunkArray(ips, MAX_CONCURRENT_REQUESTS);

      // Escanear todas las IPs pero detener en cuanto encontremos el servidor
      let totalScanned = 0;

      for (let i = 0; i < chunks.length; i++) {
        const results = await Promise.allSettled(
          chunks[i].map((ip) => this.probeServer(ip)),
        );

        totalScanned += chunks[i].length;

        // Buscar si alguna petición fue exitosa
        for (let j = 0; j < results.length; j++) {
          const result = results[j];
          if (result.status === 'fulfilled' && result.value) {
            return result.value;
          }
        }
      }

      return null;
    } finally {
      this.discovering = false;
    }
  }

  /**
   * Prueba si una IP específica tiene el servidor CloudBite
   */
  private async probeServer(ip: string): Promise<string | null> {
    const url = `http://${ip}:${DISCOVERY_PORT}/`;
    const fullUrl = `${url}${DISCOVERY_ENDPOINT}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.type === 'cloudbite-api') {
          return url;
        }
      }
    } catch (error: any) {
      // Ignorar errores esperados de conexión
    } finally {
      clearTimeout(timeoutId);
    }

    return null;
  }

  /**
   * Detecta la subnet actual probando los gateways más comunes
   */
  private async detectCurrentSubnet(): Promise<string> {
    // Probar los gateways más comunes primero
    const commonGateways = [
      '192.168.1.1',
      '192.168.0.1',
      '192.168.1.254',
      '192.168.0.254',
      '10.0.0.1',
      '172.16.0.1',
    ];

    // Probar gateways en paralelo para detectar cuál responde
    const gatewayTests = await Promise.allSettled(
      commonGateways.map(async (gateway) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 500); // Timeout corto

        try {
          // Intentar hacer una petición al gateway
          await fetch(`http://${gateway}`, {
            method: 'HEAD',
            signal: controller.signal,
          });

          return gateway;
        } catch {
          // Es normal que falle, solo queremos ver si hay respuesta
          return null;
        } finally {
          clearTimeout(timeoutId);
        }
      }),
    );

    // Extraer subnet del primer gateway que respondió
    for (const result of gatewayTests) {
      if (result.status === 'fulfilled' && result.value) {
        const parts = result.value.split('.');
        const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
        return subnet;
      }
    }

    // Si no detectamos nada, usar la más común
    return '192.168.1';
  }

  /**
   * Genera un rango de IPs para escanear
   */
  private generateIpRange(subnet: string): string[] {
    const ips: string[] = [];

    // Primero agregar IPs comunes para servidores (1-50, 100, 150, 200)
    const priorityRanges = [
      { start: 1, end: 50 }, // Rango común para servidores
      { start: 100, end: 110 }, // Otro rango común
      { start: 200, end: 210 }, // Dispositivos estáticos
    ];

    // Agregar IPs prioritarias primero
    for (const range of priorityRanges) {
      for (let i = range.start; i <= range.end; i++) {
        ips.push(`${subnet}.${i}`);
      }
    }

    // Luego agregar el resto de IPs
    for (let i = 51; i <= 254; i++) {
      // Saltar las que ya agregamos
      if (i >= 100 && i <= 110) continue;
      if (i >= 200 && i <= 210) continue;
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
    } catch (error) {
      // Ignorar error
    }
  }
}

// Exportar instancia singleton
export const discoveryService = DiscoveryService.getInstance();
