const fs = require('fs');
const path = require('path');

const checkCompatibility = (packageName) => {
  const packagePath = path.join(__dirname, '../node_modules', packageName);
  
  if (!fs.existsSync(packagePath)) {
    return { status: 'not-found', packageName };
  }

  // Buscar indicadores de Nueva Arquitectura
  const indicators = {
    turboModules: false,
    fabric: false,
    codegen: false,
    reactNativeConfig: false
  };

  // Verificar package.json
  const packageJsonPath = path.join(packagePath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Buscar configuración de codegen
    if (packageJson.codegenConfig) {
      indicators.codegen = true;
    }
  }

  // Verificar react-native.config.js
  const rnConfigPath = path.join(packagePath, 'react-native.config.js');
  if (fs.existsSync(rnConfigPath)) {
    indicators.reactNativeConfig = true;
  }

  // Buscar archivos indicadores (limitado para evitar búsquedas muy largas)
  const searchFiles = (dir, depth = 0) => {
    if (!fs.existsSync(dir) || depth > 3) return;
    
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.includes('node_modules') && !file.startsWith('.')) {
          searchFiles(filePath, depth + 1);
        } else if ((file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx')) && stat.size < 100000) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes('TurboModule')) indicators.turboModules = true;
            if (content.includes('codegenNativeComponent')) indicators.fabric = true;
          } catch (e) {
            // Ignorar errores de lectura
          }
        }
      }
    } catch (e) {
      // Ignorar errores de directorio
    }
  };

  searchFiles(packagePath);

  const isCompatible = indicators.turboModules || indicators.fabric || indicators.codegen;
  
  return {
    packageName,
    status: isCompatible ? 'compatible' : 'unknown',
    indicators
  };
};

// Leer todas las dependencias del package.json
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

// Filtrar solo las que empiezan con react-native o expo
const nativeDependencies = Object.keys(allDependencies).filter(dep => 
  dep.startsWith('react-native') || 
  dep.startsWith('expo') || 
  dep.startsWith('@react-native') ||
  dep.includes('react-native') ||
  dep === '@shopify/flash-list'
);

console.log('🔍 Verificando compatibilidad con Nueva Arquitectura...\n');
console.log(`📦 Total de dependencias nativas encontradas: ${nativeDependencies.length}\n`);

const results = {
  compatible: [],
  unknown: [],
  notFound: []
};

nativeDependencies.forEach(dep => {
  const result = checkCompatibility(dep);
  const emoji = result.status === 'compatible' ? '✅' : '⚠️';
  
  if (result.status === 'compatible') {
    results.compatible.push(dep);
    console.log(`${emoji} ${result.packageName}: Compatible`);
    const indicators = Object.entries(result.indicators)
      .filter(([_, value]) => value)
      .map(([key]) => key);
    if (indicators.length > 0) {
      console.log(`   Indicadores encontrados: ${indicators.join(', ')}`);
    }
  } else if (result.status === 'unknown') {
    results.unknown.push(dep);
    console.log(`${emoji} ${result.packageName}: Compatibilidad desconocida`);
  } else {
    results.notFound.push(dep);
    console.log(`❌ ${result.packageName}: No encontrado`);
  }
});

console.log('\n📊 Resumen:');
console.log(`✅ Compatibles: ${results.compatible.length}`);
console.log(`⚠️  Desconocidas: ${results.unknown.length}`);
console.log(`❌ No encontradas: ${results.notFound.length}`);

console.log('\n💡 Recomendaciones:');
if (results.unknown.length > 0) {
  console.log('- Las bibliotecas con compatibilidad desconocida pueden funcionar con el Interop Layer');
  console.log('- Verifica la documentación oficial de cada biblioteca');
  console.log('- Considera buscar alternativas para bibliotecas críticas sin soporte');
}

console.log('\n📚 Para más información, consulta NEW_ARCHITECTURE_COMPATIBILITY.md');