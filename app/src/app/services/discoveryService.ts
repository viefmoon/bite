import NetInfo from '@react-native-community/netinfo';
import EncryptedStorage from 'react-native-encrypted-storage';
import EventEmitter from 'eventemitter3';

const DISCOVERY_PORT = 3737;
const DISCOVERY_ENDPOINT = 'api/v1/discovery'; // Sin la barra inicial
const STORAGE_KEY = 'last_known_api_url';
const DISCOVERY_TIMEOUT = 2000; // 2 segundos por IP
const MAX_CONCURRENT_REQUESTS = 10; // Más requests concurrentes
const BATCH_DELAY = 100; // Delay pequeño entre lotes

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
   * Función de prueba para verificar si fetch funciona en producción
   */
  async testFetch(): Promise<void> {
    this.log('🧪 INICIANDO PRUEBA DE FETCH');
    
    try {
      // Prueba 1: Fetch a Google (HTTPS)
      this.log('📡 Prueba 1: Fetch a https://www.google.com');
      const googleResponse = await fetch('https://www.google.com', {
        method: 'HEAD',
      });
      this.log(`✅ Google respondió: ${googleResponse.status}`);
    } catch (error: any) {
      this.log(`❌ Error con Google: ${error.message}`);
    }
    
    try {
      // Prueba 2: Fetch a IP local (HTTP)
      const testUrl = `http://192.168.1.38:${DISCOVERY_PORT}/`;
      this.log(`📡 Prueba 2: Fetch a ${testUrl}`);
      const localResponse = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      this.log(`✅ Servidor local respondió: ${localResponse.status}`);
    } catch (error: any) {
      this.log(`❌ Error con servidor local: ${error.message}`);
    }
    
    this.log('🧪 PRUEBA COMPLETADA');
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

      // Log simple de inicio
      this.log(`🔧 Buscando servidor en puerto ${DISCOVERY_PORT}`);
      this.log(`📱 Entorno: ${__DEV__ ? 'DESARROLLO' : 'PRODUCCIÓN'}`);
      
      // Ejecutar prueba de fetch solo la primera vez
      if (this.lastDiscoveryTime === 0) {
        await this.testFetch();
      }

      // Obtener lista de subnets prioritarias para escanear
      const subnets = await this.detectCurrentSubnet();
      this.log(`📡 Iniciando búsqueda en redes: ${subnets.join(', ')}`);

      // Probar cada subnet hasta encontrar el servidor
      for (const subnet of subnets) {
        this.log(`🔍 Escaneando red ${subnet}.*`);
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
          
          // No necesitamos este log, ya se verá si responde
          
          const results = await Promise.allSettled(
            currentIps.map((ip) => this.probeServer(ip)),
          );

          totalIpsScanned += currentIps.length;
          
          // Buscar si alguna petición fue exitosa
          for (let j = 0; j < results.length; j++) {
            const result = results[j];
            if (result.status === 'fulfilled' && result.value) {
              const foundIp = currentIps[j];
              this.log(`✅ ¡SERVIDOR ENCONTRADO EN ${foundIp}!`);
              // Agregar delay de 3 segundos antes de retornar para que se pueda leer
              this.log(`⏳ Esperando 3 segundos antes de conectar...`);
              await new Promise(resolve => setTimeout(resolve, 3000));
              return result.value;
            }
          }
          
          // Mostrar progreso cada 10 IPs
          if (totalIpsScanned % 10 === 0) {
            const lastIp = currentIps[currentIps.length - 1];
            this.log(`  ▶ Escaneadas ${totalIpsScanned} IPs (última: ${lastIp})`);
          }
        }
        
        this.log(`  ❌ No encontrado en ${subnet}.*`);
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
    const fullUrl = `http://${ip}:${DISCOVERY_PORT}/${DISCOVERY_ENDPOINT}`;
    
    // Variables para tracking
    const startTime = Date.now();
    let gotResponse = false;

    // Crear AbortController para timeout real
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, DISCOVERY_TIMEOUT);

    try {
      // Log antes del fetch para debugging
      if (ip === '192.168.1.38' || ip.endsWith('.1')) {
        this.log(`🚀 Intentando fetch a ${ip}...`);
      }
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      gotResponse = true;
      
      // IMPORTANTE: Si llegamos aquí, la petición HTTP SÍ salió y recibió respuesta
      if (response.status !== 0) {
        // Cualquier status diferente de 0 significa que hubo comunicación HTTP
        this.log(`📶 ${ip} respondió con HTTP ${response.status}`);
      }

      if (response.ok) {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          if (data.type === 'cloudbite-api') {
            this.log(`\n✅ ¡SERVIDOR CLOUDBITE ENCONTRADO!`);
            this.log(`📍 IP: ${ip}`);
            this.log(`🔗 URL: ${url}`);
            return url;
          } else {
            // Otro servicio HTTP respondió, pero no es CloudBite
            this.log(`🔸 ${ip} tiene un servicio HTTP pero NO es CloudBite`);
          }
        } catch (parseError) {
          this.log(`🔸 ${ip} respondió HTTP 200 pero no es JSON válido`);
        }
      }
    } catch (error: any) {
      // Si NO recibimos respuesta, verificar por qué
      if (!gotResponse) {
        if (error.name === 'AbortError') {
          // Timeout - la IP no respondió a tiempo
          // No loguear nada para timeouts, son normales
        } else if (error.message?.includes('Network request failed')) {
          // Error de red - probablemente no hay nada en esa IP
          // No loguear nada, es normal
        } else {
          // Este es un error inusual que SÍ queremos ver
          this.log(`⚠️ ${ip} - Error inusual: ${error.message}`);
        }
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
