# Configuración de Cloudflare Tunnel para CloudBite

Esta guía te ayudará a configurar Cloudflare Tunnel para acceder a tu restaurante desde cualquier lugar con internet.

## ¿Qué es Cloudflare Tunnel?

Cloudflare Tunnel crea una conexión segura entre tu servidor local y la red de Cloudflare, permitiendo:
- ✅ Acceso remoto sin abrir puertos en tu router
- ✅ HTTPS automático con certificados SSL
- ✅ Protección contra ataques DDoS
- ✅ Sin necesidad de IP estática
- ✅ **GRATIS** para hasta 50 usuarios

## Requisitos Previos

1. **Cuenta de Cloudflare** (gratis en [cloudflare.com](https://cloudflare.com))
2. **Un dominio** agregado a Cloudflare (puede ser uno gratuito de Freenom)
3. **Backend de CloudBite funcionando** en el puerto 3737

## Instalación Rápida

### Opción 1: Script Automático (Recomendado)

```bash
cd backend
npm run setup:cloudflare-tunnel
```

Este script:
- Verifica la instalación de cloudflared
- Te guía paso a paso por la configuración
- Crea los archivos necesarios automáticamente
- Configura el dominio en Cloudflare

### Opción 2: Instalación Manual

#### Paso 1: Instalar cloudflared

**Windows:**
```bash
winget install Cloudflare.cloudflared
# o descarga desde: https://github.com/cloudflare/cloudflared/releases
```

**macOS:**
```bash
brew install cloudflared
```

**Linux:**
```bash
# Debian/Ubuntu
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Otros Linux
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

#### Paso 2: Autenticarse con Cloudflare

```bash
cloudflared tunnel login
```

Esto abrirá tu navegador para iniciar sesión en Cloudflare.

#### Paso 3: Crear el Túnel

```bash
cloudflared tunnel create cloudbite-restaurante
```

#### Paso 4: Configurar el Túnel

Crea el archivo `backend/.cloudflared/config.yml`:

```yaml
tunnel: [TU-TUNNEL-ID]
credentials-file: ~/.cloudflared/[TU-TUNNEL-ID].json

ingress:
  - hostname: api.tu-restaurante.com
    service: http://localhost:3737
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

#### Paso 5: Configurar DNS

```bash
cloudflared tunnel route dns cloudbite-restaurante api.tu-restaurante.com
```

#### Paso 6: Actualizar Variables de Entorno

Agrega a tu archivo `.env`:

```env
# Cloudflare Tunnel Configuration
REMOTE_URL=https://api.tu-restaurante.com
TUNNEL_NAME=cloudbite-restaurante
```

## Uso Diario

### Iniciar el Servidor con Túnel

**Windows:**
```bash
cd backend
.\scripts\start-with-tunnel.bat
```

**Linux/macOS:**
```bash
cd backend
./scripts/start-with-tunnel.sh
```

### Verificar Funcionamiento

1. **Local**: http://localhost:3737/api/v1/discovery
2. **Remoto**: https://api.tu-restaurante.com/api/v1/discovery

Deberías ver:
```json
{
  "type": "cloudbite-api",
  "name": "CloudBite Restaurant API",
  "remoteUrl": "https://api.tu-restaurante.com",
  "tunnelEnabled": true
}
```

## Configuración en la App

La app detectará automáticamente la URL remota cuando:

1. **Red Local**: Usará auto-descubrimiento (sin cambios)
2. **Fuera de la Red**: 
   - Detectará que el servidor local no está disponible
   - Mostrará la opción de usar el servidor remoto
   - Se conectará automáticamente a la URL de Cloudflare

### Configuración Manual (si es necesario)

1. Abre el menú lateral (hamburguesa)
2. Ve a "Configuración del Servidor"
3. Selecciona "Remoto (Internet)"
4. La app usará automáticamente la URL configurada

## Solución de Problemas

### El túnel no se conecta

```bash
# Verificar logs
cloudflared tunnel run cloudbite-restaurante --loglevel debug

# Verificar configuración
cloudflared tunnel list
cloudflared tunnel info cloudbite-restaurante
```

### La app no encuentra el servidor remoto

1. Verifica que el backend tenga `REMOTE_URL` en `.env`
2. Reinicia el backend después de cambiar `.env`
3. Verifica que el endpoint discovery responda con `remoteUrl`

### Error de certificado SSL

Si ves errores de certificado:
1. Asegúrate de usar `https://` en la URL
2. Verifica que el dominio esté activo en Cloudflare
3. Espera 5-10 minutos para propagación DNS

## Seguridad

### Proteger el Acceso (Opcional)

Para agregar autenticación adicional:

1. Ve a [Cloudflare Zero Trust](https://one.dash.cloudflare.com/)
2. Access > Applications > Add application
3. Configura reglas de acceso (email, IP, etc.)

### Mejores Prácticas

- ✅ Usa siempre HTTPS para conexiones remotas
- ✅ Mantén actualizado cloudflared
- ✅ Monitorea los logs de acceso
- ✅ Considera usar Cloudflare Access para autenticación extra
- ❌ No expongas puertos directamente en tu router
- ❌ No compartas las credenciales del túnel

## Comandos Útiles

```bash
# Ver estado del túnel
cloudflared tunnel info cloudbite-restaurante

# Ver métricas
cloudflared tunnel metrics cloudbite-restaurante

# Detener túnel
cloudflared tunnel cleanup cloudbite-restaurante

# Eliminar túnel
cloudflared tunnel delete cloudbite-restaurante
```

## Automatización con Systemd (Linux)

Para ejecutar automáticamente al iniciar el sistema:

```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

## Costos

- **Gratis**: Hasta 50 usuarios simultáneos
- **Pago**: $7/usuario/mes para más de 50 usuarios
- **Sin límites** de ancho de banda o solicitudes

## Soporte

- [Documentación Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [CloudBite Issues](https://github.com/tu-usuario/cloudbite/issues)
- [Cloudflare Community](https://community.cloudflare.com/)