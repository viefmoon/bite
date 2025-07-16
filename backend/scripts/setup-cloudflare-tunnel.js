#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function setupCloudfareTunnel() {
  console.log('🚀 Configuración de Cloudflare Tunnel para CloudBite\n');

  try {
    // Verificar si cloudflared está instalado
    try {
      execSync('cloudflared --version', { stdio: 'ignore' });
      console.log('✅ cloudflared está instalado');
    } catch {
      console.log('❌ cloudflared no está instalado');
      console.log('\nPara instalar cloudflared:');
      console.log('- Windows: winget install Cloudflare.cloudflared');
      console.log('- macOS: brew install cloudflared');
      console.log('- Linux: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/\n');
      process.exit(1);
    }

    // Verificar si ya existe un túnel configurado
    const tunnelConfigPath = path.join(__dirname, '..', '.cloudflared', 'config.yml');
    if (fs.existsSync(tunnelConfigPath)) {
      const overwrite = await question('Ya existe una configuración de túnel. ¿Deseas sobrescribirla? (s/n): ');
      if (overwrite.toLowerCase() !== 's') {
        console.log('Configuración cancelada.');
        process.exit(0);
      }
    }

    // Autenticarse con Cloudflare
    console.log('\n📝 Autenticándose con Cloudflare...');
    console.log('Se abrirá tu navegador para iniciar sesión.');
    execSync('cloudflared tunnel login', { stdio: 'inherit' });

    // Crear túnel
    const tunnelName = await question('\nNombre del túnel (ej: cloudbite-prod): ') || 'cloudbite';
    console.log(`\n🔧 Creando túnel "${tunnelName}"...`);
    
    try {
      execSync(`cloudflared tunnel create ${tunnelName}`, { stdio: 'inherit' });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('El túnel ya existe, continuando con la configuración...');
      } else {
        throw error;
      }
    }

    // Obtener ID del túnel
    const tunnelList = execSync('cloudflared tunnel list --output json').toString();
    const tunnels = JSON.parse(tunnelList);
    const tunnel = tunnels.find(t => t.name === tunnelName);
    
    if (!tunnel) {
      throw new Error('No se pudo encontrar el túnel creado');
    }

    // Configurar dominio
    const domain = await question('\nDominio de Cloudflare (ej: ejemplo.com): ');
    const subdomain = await question('Subdominio (ej: api, dejar vacío para usar dominio raíz): ');
    const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

    // Crear configuración
    const config = {
      tunnel: tunnel.id,
      credentials_file: path.join('~', '.cloudflared', `${tunnel.id}.json`),
      ingress: [
        {
          hostname: fullDomain,
          service: 'http://localhost:3737',
          originRequest: {
            noTLSVerify: true
          }
        },
        {
          service: 'http_status:404'
        }
      ]
    };

    // Guardar configuración
    const configDir = path.join(__dirname, '..', '.cloudflared');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(
      tunnelConfigPath,
      `# Configuración generada automáticamente para CloudBite\n` +
      `tunnel: ${config.tunnel}\n` +
      `credentials-file: ${config.credentials_file}\n\n` +
      `ingress:\n` +
      `  - hostname: ${fullDomain}\n` +
      `    service: http://localhost:3737\n` +
      `    originRequest:\n` +
      `      noTLSVerify: true\n` +
      `  - service: http_status:404\n`
    );

    // Configurar DNS
    console.log(`\n🌐 Configurando DNS para ${fullDomain}...`);
    execSync(`cloudflared tunnel route dns ${tunnelName} ${fullDomain}`, { stdio: 'inherit' });

    // Crear script de inicio
    const startScript = `#!/bin/bash
# Script para iniciar CloudBite con Cloudflare Tunnel

echo "🚀 Iniciando CloudBite Backend..."
npm run start:prod &
BACKEND_PID=$!

echo "🔧 Esperando a que el backend esté listo..."
sleep 5

echo "🌐 Iniciando Cloudflare Tunnel..."
cloudflared tunnel run ${tunnelName}

# Cleanup
kill $BACKEND_PID
`;

    fs.writeFileSync(
      path.join(__dirname, 'start-with-tunnel.sh'),
      startScript,
      { mode: 0o755 }
    );

    // Crear script para Windows
    const startScriptWin = `@echo off
echo 🚀 Iniciando CloudBite Backend...
start /b npm run start:prod

echo 🔧 Esperando a que el backend esté listo...
timeout /t 5 /nobreak > nul

echo 🌐 Iniciando Cloudflare Tunnel...
cloudflared tunnel run ${tunnelName}
`;

    fs.writeFileSync(
      path.join(__dirname, 'start-with-tunnel.bat'),
      startScriptWin
    );

    // Actualizar .env con la URL remota
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    if (!envContent.includes('REMOTE_URL')) {
      envContent += `\n# Cloudflare Tunnel Configuration\n`;
      envContent += `REMOTE_URL=https://${fullDomain}\n`;
      envContent += `TUNNEL_NAME=${tunnelName}\n`;
      fs.writeFileSync(envPath, envContent);
    }

    console.log('\n✅ Configuración completada exitosamente!\n');
    console.log('📋 Resumen:');
    console.log(`- Túnel: ${tunnelName}`);
    console.log(`- URL Local: http://localhost:3737`);
    console.log(`- URL Remota: https://${fullDomain}`);
    console.log(`- Configuración: ${tunnelConfigPath}`);
    console.log('\n🚀 Para iniciar el servidor con el túnel:');
    console.log(`- Linux/Mac: ./scripts/start-with-tunnel.sh`);
    console.log(`- Windows: .\\scripts\\start-with-tunnel.bat`);
    console.log('\n💡 La app detectará automáticamente si usar conexión local o remota.');

  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Ejecutar configuración
setupCloudfareTunnel();