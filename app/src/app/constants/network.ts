export const NETWORK_CONFIG = {
  // Puerto del servidor
  DISCOVERY_PORT: 3737,

  // Timeouts en milisegundos
  DISCOVERY_TIMEOUT: 1000,
  HEALTH_CHECK_TIMEOUT: 3000,
  API_TIMEOUT: 5000,

  // Intervalos de monitoreo
  HEALTH_CHECK_INTERVAL: 30000, // 30 segundos
  HEALTH_RETRY_INTERVALS: [5000, 10000, 20000, 30000], // 5s, 10s, 20s, 30s

  // Reconexión
  MIN_DISCOVERY_INTERVAL: 10000, // 10 segundos entre discoveries
  RECONNECT_CYCLE_DELAY: 10000, // 10 segundos entre ciclos
  HEALTH_CHECK_ATTEMPTS: 3,

  // Discovery
  MAX_CONCURRENT_REQUESTS: 50,

  // Subnets comunes para escanear
  COMMON_SUBNETS: ['192.168.1', '192.168.0', '10.0.0'],
} as const;
