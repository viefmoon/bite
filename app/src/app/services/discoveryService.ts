import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';
import EventEmitter from 'eventemitter3';

const DISCOVERY_PORT = 3737;
const DISCOVERY_ENDPOINT = 'api/v1/discovery'; // Sin la barra inicial
const STORAGE_KEY = 'last_known_api_url';
const DISCOVERY_TIMEOUT = 3000; // 3 segundos por IP
const MAX_CONCURRENT_REQUESTS = 3; // Menos concurrentes para dar más tiempo
const BATCH_DELAY = 500; // Medio segundo entre lotes para evitar saturación

interface DiscoveryResponse {
  type: string;
  name: string;
  version: string;
  port: number;
  features: string[];
  timestamp: number;
}

export class DiscoveryService extends EventEmitter {
  private static instance: DiscoveryService;
  private cachedUrl: string | null = null;
  private discovering = false;
  private discoveryPromise: Promise<string | null> | null = null;
  private lastDiscoveryTime = 0;
  private MIN_DISCOVERY_INTERVAL = 10000; // 10 segundos mínimo entre descubrimientos
  private logCallback: ((message: string) => void) | null = null;

  private constructor() {
    super();
  }
  
  /**
   * Establece un callback para logs (más confiable que eventos en producción)
   */
  setLogCallback(callback: ((message: string) => void) | null) {
    this.logCallback = callback;
  }
  
  private log(message: string) {
    // Usar callback directo si está disponible
    if (this.logCallback) {
      this.logCallback(message);
    }
    // También emitir evento por compatibilidad
    this.emit('discovery:log', message);
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

    // Si no hay URL válida, devolver null en lugar de lanzar error
    return null;
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

    // FORZAR nueva búsqueda - limpiar cache SIEMPRE en forceRediscovery
    this.cachedUrl = null;
    try {
      await EncryptedStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Ignorar error
    }

    // Verificar que no se esté llamando muy frecuentemente (solo para evitar spam)
    const now = Date.now();
    const timeSinceLastDiscovery = now - this.lastDiscoveryTime;
    if (timeSinceLastDiscovery < this.MIN_DISCOVERY_INTERVAL) {
      // Reducir el intervalo mínimo para producción, pero still dar tiempo entre intentos
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
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

      // Obtener lista de subnets prioritarias para escanear
      const subnets = await this.detectCurrentSubnet();
      this.log(`Escaneando subnets: ${subnets.join(', ')}`);

      // Probar cada subnet hasta encontrar el servidor
      for (const subnet of subnets) {
        this.log(`\n[${subnet}.*] Iniciando escaneo...`);
        const ips = this.generateIpRange(subnet);
        const chunks = this.chunkArray(ips, MAX_CONCURRENT_REQUESTS);

        // Escanear todas las IPs de esta subnet
        let totalIpsScanned = 0;
        const totalIps = ips.length;
        
        for (let i = 0; i < chunks.length; i++) {
          // Agregar un pequeño delay entre lotes para evitar sobrecarga
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
          }

          const currentIps = chunks[i];
          // Mostrar las IPs exactas que se están escaneando
          const ipNumbers = currentIps.map(ip => ip.split('.').pop()).join(', ');
          
          this.log(`Escaneando: ${subnet}.[${ipNumbers}]`);

          // Iniciar todas las requests del lote
          const startTime = Date.now();
          const results = await Promise.allSettled(
            currentIps.map((ip) => this.probeServer(ip)),
          );
          const elapsed = Date.now() - startTime;
          
          // Si el lote se completó muy rápido, agregar un delay adicional
          if (elapsed < 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
          }

          totalIpsScanned += currentIps.length;
          
          // Buscar si alguna petición fue exitosa
          for (let j = 0; j < results.length; j++) {
            const result = results[j];
            if (result.status === 'fulfilled' && result.value) {
              const foundIp = currentIps[j];
              this.log(`✅ ¡SERVIDOR ENCONTRADO EN ${foundIp}!`);
              return result.value;
            }
          }
          
          // Mostrar progreso cada 20 IPs
          if (totalIpsScanned % 20 === 0 || totalIpsScanned === totalIps) {
            const progress = Math.round((totalIpsScanned / totalIps) * 100);
            this.log(`Progreso: ${progress}% (${totalIpsScanned}/${totalIps} IPs)`);
          }
        }
        
        this.log(`❌ No encontrado en subnet ${subnet}.*`);
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

    // Crear AbortController para timeout real
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, DISCOVERY_TIMEOUT);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.type === 'cloudbite-api') {
            this.log(`✅ Respuesta válida de ${ip}`);
            return url;
          }
        } catch (parseError) {
          this.log(`⚠️ Error parseando respuesta de ${ip}`);
        }
      }
    } catch (error: any) {
      // Solo loguear si no es un error de abort/timeout esperado
      if (error.name !== 'AbortError' && !error.message?.includes('aborted')) {
        // Error real de conexión (no timeout)
      }
    } finally {
      clearTimeout(timeoutId);
    }

    return null;
  }

  /**
   * Obtiene las subnets más comunes para escanear, en orden de prioridad
   * Ya no intenta detectar la subnet actual para evitar problemas de seguridad en Android
   */
  private async detectCurrentSubnet(): Promise<string[]> {
    // Retornar las subnets más comunes en orden de prioridad
    // Esto es más confiable que intentar hacer HTTP requests a gateways
    return [
      '192.168.1',    // La más común en redes domésticas
      '192.168.0',    // Segunda más común  
      '192.168.2',    // Algunas configuraciones alternativas
      '10.0.0',       // Redes corporativas comunes
      '172.16.0',     // Otras redes privadas
      '192.168.100',  // Algunas configuraciones especiales
    ];
  }

  /**
   * Genera un rango de IPs para escanear
   */
  private generateIpRange(subnet: string): string[] {
    const ips: string[] = [];

    // Escanear todas las IPs en orden secuencial del 1 al 254
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
    } catch (error) {
      // Ignorar error
    }
  }
}

// Exportar instancia singleton
export const discoveryService = DiscoveryService.getInstance();
