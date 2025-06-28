#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Buscar todos los archivos que importan apiClient
const files = glob.sync('src/**/*.{ts,tsx}', {
  ignore: [
    'src/app/services/apiClient.ts',
    'src/app/services/apiClientWrapper.ts',
    'src/app/services/discoveryService.ts'
  ]
});

let updatedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // Reemplazar import de apiClient
  if (content.includes("from '../app/services/apiClient'") || 
      content.includes('from "../app/services/apiClient"') ||
      content.includes("from '../../app/services/apiClient'") ||
      content.includes('from "../../app/services/apiClient"') ||
      content.includes("from '../../../app/services/apiClient'") ||
      content.includes('from "../../../app/services/apiClient"')) {
    
    // Reemplazar el import
    content = content.replace(
      /import\s+apiClient\s+from\s+['"].*\/apiClient['"]/g,
      (match) => {
        const pathMatch = match.match(/['"](.*)\/apiClient['"]/);
        if (pathMatch) {
          return `import ApiClientWrapper from '${pathMatch[1]}/apiClientWrapper'`;
        }
        return match;
      }
    );

    // Reemplazar usos de apiClient con ApiClientWrapper
    content = content.replace(/\bapiClient\./g, 'ApiClientWrapper.');
    
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(file, content);
    updatedFiles++;
    console.log(`✓ Actualizado: ${file}`);
  }
});

console.log(`\n✅ Se actualizaron ${updatedFiles} archivos`);
console.log('\nNOTA: Revisa los cambios y asegúrate de que todo funcione correctamente.');