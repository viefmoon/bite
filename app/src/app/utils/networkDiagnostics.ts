import { API_URL } from '@env';
import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';

interface NetworkDiagnosticResult {
  timestamp: Date;
  apiUrl: string;
  networkState: {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
    details: any;
  };
  apiTest: {
    success: boolean;
    responseTime?: number;
    error?: string;
    errorCode?: string;
  };
  dnsTest: {
    success: boolean;
    responseTime?: number;
    error?: string;
  };
  recommendations: string[];
}

export async function runNetworkDiagnostics(): Promise<NetworkDiagnosticResult> {
  const result: NetworkDiagnosticResult = {
    timestamp: new Date(),
    apiUrl: API_URL,
    networkState: {
      isConnected: null,
      isInternetReachable: null,
      type: 'unknown',
      details: null,
    },
    apiTest: {
      success: false,
    },
    dnsTest: {
      success: false,
    },
    recommendations: [],
  };

  console.log('[NetworkDiagnostics] Iniciando diagnóstico de red...');

  // 1. Verificar estado de la red
  try {
    const netInfoState = await NetInfo.fetch();
    result.networkState = {
      isConnected: netInfoState.isConnected,
      isInternetReachable: netInfoState.isInternetReachable,
      type: netInfoState.type,
      details: netInfoState.details,
    };
    console.log('[NetworkDiagnostics] Estado de red:', result.networkState);
  } catch (error: any) {
    console.error(
      '[NetworkDiagnostics] Error obteniendo estado de red:',
      error,
    );
  }

  // 2. Probar conexión directa a la API
  const apiStartTime = Date.now();
  try {
    console.log('[NetworkDiagnostics] Probando conexión a API:', API_URL);
    const response = await axios.get(`${API_URL}/api/v1/health`, {
      timeout: 5000,
      validateStatus: () => true, // Aceptar cualquier status
    });
    const responseTime = Date.now() - apiStartTime;

    result.apiTest = {
      success: response.status < 500,
      responseTime,
      error: response.status >= 500 ? `Status ${response.status}` : undefined,
    };
    console.log('[NetworkDiagnostics] Resultado API test:', result.apiTest);
  } catch (error: any) {
    const responseTime = Date.now() - apiStartTime;
    result.apiTest = {
      success: false,
      responseTime,
      error: error.message,
      errorCode: error.code,
    };
    console.error(
      '[NetworkDiagnostics] Error en API test:',
      error.code,
      error.message,
    );
  }

  // 3. Probar resolución DNS con un servicio externo
  const dnsStartTime = Date.now();
  try {
    console.log('[NetworkDiagnostics] Probando DNS con servicio externo...');
    await axios.get(
      'https://dns.google/resolve?name=google.com',
      {
        timeout: 5000,
      },
    );
    const responseTime = Date.now() - dnsStartTime;

    result.dnsTest = {
      success: true,
      responseTime,
    };
    console.log('[NetworkDiagnostics] DNS test exitoso');
  } catch (error: any) {
    const responseTime = Date.now() - dnsStartTime;
    result.dnsTest = {
      success: false,
      responseTime,
      error: error.message,
    };
    console.error('[NetworkDiagnostics] Error en DNS test:', error.message);
  }

  // 4. Generar recomendaciones basadas en los resultados
  if (!result.networkState.isConnected) {
    result.recommendations.push(
      'No hay conexión de red. Verifica tu WiFi o datos móviles.',
    );
  }

  if (
    result.networkState.isConnected &&
    !result.networkState.isInternetReachable
  ) {
    result.recommendations.push(
      'Conectado a la red pero sin acceso a Internet. Verifica tu router o punto de acceso.',
    );
  }

  if (!result.apiTest.success && result.apiTest.errorCode === 'ECONNREFUSED') {
    result.recommendations.push(
      'El servidor backend no está respondiendo. Verifica que esté en ejecución.',
    );
  }

  if (!result.apiTest.success && result.apiTest.errorCode === 'ETIMEDOUT') {
    result.recommendations.push(
      'Timeout al conectar con el servidor. Posible problema de red local o firewall.',
    );
  }

  if (!result.apiTest.success && result.apiTest.errorCode === 'ENOTFOUND') {
    result.recommendations.push(
      'No se puede resolver la dirección del servidor. Verifica la configuración de API_URL.',
    );
  }

  if (result.apiTest.responseTime && result.apiTest.responseTime > 3000) {
    result.recommendations.push(
      'La latencia de red es muy alta. Considera acercarte al router o usar una conexión más estable.',
    );
  }

  if (!result.dnsTest.success) {
    result.recommendations.push(
      'Problemas con la resolución DNS. Intenta cambiar los servidores DNS de tu red.',
    );
  }

  // Recomendaciones específicas para el problema del PC
  if (
    result.apiTest.errorCode === 'ECONNRESET' ||
    result.apiTest.errorCode === 'ECONNABORTED'
  ) {
    result.recommendations.push(
      'La conexión se está interrumpiendo. Posibles causas:',
    );
    result.recommendations.push('- Firewall o antivirus interfiriendo');
    result.recommendations.push('- Problemas con el adaptador de red');
    result.recommendations.push(
      '- Configuración de ahorro de energía en el adaptador',
    );
    result.recommendations.push('- Driver de red desactualizado');
  }

  console.log('[NetworkDiagnostics] Diagnóstico completo:', result);
  return result;
}

export function formatDiagnosticResult(
  result: NetworkDiagnosticResult,
): string {
  let output = '=== DIAGNÓSTICO DE RED ===\n\n';

  output += `Fecha: ${result.timestamp.toLocaleString()}\n`;
  output += `URL de API: ${result.apiUrl}\n\n`;

  output += '📡 ESTADO DE RED:\n';
  output += `- Conectado: ${result.networkState.isConnected ? 'Sí' : 'No'}\n`;
  output += `- Internet accesible: ${result.networkState.isInternetReachable ? 'Sí' : 'No'}\n`;
  output += `- Tipo: ${result.networkState.type}\n\n`;

  output += '🔌 TEST DE API:\n';
  output += `- Exitoso: ${result.apiTest.success ? 'Sí' : 'No'}\n`;
  if (result.apiTest.responseTime) {
    output += `- Tiempo de respuesta: ${result.apiTest.responseTime}ms\n`;
  }
  if (result.apiTest.error) {
    output += `- Error: ${result.apiTest.error}\n`;
    output += `- Código: ${result.apiTest.errorCode || 'N/A'}\n`;
  }
  output += '\n';

  output += '🌐 TEST DNS:\n';
  output += `- Exitoso: ${result.dnsTest.success ? 'Sí' : 'No'}\n`;
  if (result.dnsTest.responseTime) {
    output += `- Tiempo de respuesta: ${result.dnsTest.responseTime}ms\n`;
  }
  if (result.dnsTest.error) {
    output += `- Error: ${result.dnsTest.error}\n`;
  }
  output += '\n';

  if (result.recommendations.length > 0) {
    output += '💡 RECOMENDACIONES:\n';
    result.recommendations.forEach((rec) => {
      output += `- ${rec}\n`;
    });
  }

  return output;
}
