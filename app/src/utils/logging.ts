// Utilidad para logging completo sin truncar datos
export const logComplete = (label: string, data: any) => {
  console.log(`\n========== ${label} ==========`);

  if (typeof data === 'object' && data !== null) {
    // Para objetos y arrays, usar JSON.stringify con formato bonito
    console.log(JSON.stringify(data, null, 2));
  } else {
    // Para primitivos, mostrar directamente
    console.log(data);
  }

  console.log(`========== FIN ${label} ==========\n`);
};

// Logger específico para errores con stack trace completo
export const logError = (label: string, error: any) => {
  console.error(`\n❌ ERROR: ${label}`);

  if (error instanceof Error) {
    console.error('Mensaje:', error.message);
    console.error('Stack completo:');
    console.error(error.stack);
  } else {
    console.error('Error completo:', JSON.stringify(error, null, 2));
  }

  console.error(`❌ FIN ERROR: ${label}\n`);
};

// Logger para respuestas de API
export const logApiResponse = (endpoint: string, response: any) => {
  console.log(`\n📡 API Response: ${endpoint}`);
  console.log('Status:', response.status || 'N/A');
  console.log('Headers:', response.headers || 'N/A');
  console.log('Data completa:');
  console.log(JSON.stringify(response.data || response, null, 2));
  console.log(`📡 FIN API Response: ${endpoint}\n`);
};

// Logger para debugging con múltiples valores
export const logDebug = (label: string, ...values: any[]) => {
  console.log(`\n🔍 DEBUG: ${label}`);

  values.forEach((value, index) => {
    console.log(`Valor ${index + 1}:`);
    if (typeof value === 'object' && value !== null) {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(value);
    }
  });

  console.log(`🔍 FIN DEBUG: ${label}\n`);
};
