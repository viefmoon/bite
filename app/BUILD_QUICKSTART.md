# 🚀 Guía Rápida - Builds Locales

## Primera vez (Configuración)

```bash
# 1. Ejecutar scripts de instalación
cd /home/leo/bite/app
./install-java-and-fix.sh
./install-android-sdk.sh
source ~/.bashrc

# 2. Login en EAS
npx eas login
```

## Crear Build Local

```bash
# Build de desarrollo para dispositivo Android
npm run build:android:dev

# El APK se generará como: build-[timestamp].apk
```

## Instalar en Dispositivo

```bash
# Ver dispositivos conectados
adb devices

# Instalar APK
adb install build-*.apk
```

## Ejecutar la App

### Desarrollo desde WSL2 (Recomendado)

```bash
# Usar script con modo tunnel (más confiable para WSL2)
./start-wsl.sh

# Selecciona:
# 1 - Para Expo Go (más simple)
# 2 - Para Development Build (APK instalado)
```

### Alternativa directa
```bash
# Modo tunnel (recomendado para WSL2)
npx expo start --tunnel          # Para Expo Go
npx expo start --dev-client --tunnel  # Para Development Build

# Modo LAN (puede tener problemas en WSL2)
npm start
```

**Nota:** El modo tunnel es más lento pero evita problemas de red entre WSL2 y dispositivos físicos.

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `install-java-and-fix.sh` | Instala Java 17 y actualiza paquetes Expo |
| `install-android-sdk.sh` | Instala Android SDK y configura el entorno |
| `setup-android-env.sh` | Script alternativo si ya tienes Java |
| `set-java-env.sh` | Configura temporalmente las variables de Java |

## Comandos de Build

| Comando | Descripción |
|---------|-------------|
| `npm run build:android:sim` | Build para emulador Android |
| `npm run build:android:dev` | Build para dispositivo Android (desarrollo) |
| `npm run build:android:prod` | Build de producción Android |

## Requisitos del Sistema

- Ubuntu/Debian (probado en WSL2)
- Node.js >=18.18.0
- Java JDK 17
- Android SDK con API 34
- ~10GB de espacio libre

## Troubleshooting

### Java no encontrado
```bash
./install-java-and-fix.sh
source ~/.bashrc
```

### Android SDK no encontrado
```bash
./install-android-sdk.sh
source ~/.bashrc
```

### Dispositivo no detectado
```bash
# Verificar modo desarrollador y depuración USB
adb devices
adb kill-server
adb start-server
```

## Build Exitosa

Cuando la build sea exitosa verás:
```
Build successful
You can find the build artifacts in /home/leo/bite/app/build-1748967974325.apk
```