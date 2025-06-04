# 🚀 Guía Rápida - Builds Locales

## Primera vez (Configuración)

```bash
# 1. Ejecutar scripts de instalación
cd /home/leo/bite/app
./install-java-and-fix.sh
./install-android-sdk.sh
source ~/.bashrc

# 2. Instalar EAS CLI y login
npm install -g eas-cli
eas login
```

## Crear Build Local

```bash
# Build de desarrollo para dispositivo Android
npm run build:android:sim

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

```bash
# Para Expo Go
npx expo start

# Para Development Build (APK instalado)
npx expo start --dev-client

# Si tienes problemas de conexión de red, usa modo tunnel
npx expo start --tunnel          # Para Expo Go
npx expo start --dev-client --tunnel  # Para Development Build
```

**Nota:** El modo tunnel es más confiable para problemas de red aunque ligeramente más lento.

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

- Ubuntu/Debian
- Node.js >=18.18.0
- Java JDK 17
- Android SDK con API 34
- ~10GB de espacio libre

## Notas Importantes

- Las variables de entorno de Android SDK pueden no persistir entre sesiones
- Si encuentras errores de SDK, ejecuta `source ~/.bashrc` o crea el archivo `android/local.properties`
- Los builds locales con EAS pueden fallar si no se aceptan todas las licencias del Android SDK

## Troubleshooting

### Error: Cannot determine which native SDK version (expo module not installed)
```bash
# Este error ocurre cuando el módulo expo no está instalado
# Solución:
npm install expo
npx expo install --fix
```

### Error: could not determine executable to run (npx eas)
```bash
# Este error ocurre cuando EAS CLI no está instalado
# Solución:
npm install -g eas-cli
eas login  # En lugar de npx eas login
```

### Java no encontrado
```bash
./install-java-and-fix.sh
source ~/.bashrc
```

### Android SDK no encontrado (Build local con EAS)
```bash
# 1. Instalar Android SDK
./install-android-sdk.sh
source ~/.bashrc

# 2. Si el error persiste, configurar variables en la sesión actual:
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$HOME/android-sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools

# 3. Crear local.properties
echo "sdk.dir=$HOME/android-sdk" > android/local.properties

# 4. Alternativa: Usar una shell con las variables cargadas
bash -c "source ~/.bashrc && npm run build:android:sim"

# 5. Si nada funciona, considerar usar build en la nube:
eas build --platform android --profile development  # Sin --local
```

### Dispositivo no detectado
```bash
# Verificar modo desarrollador y depuración USB
adb devices
adb kill-server
adb start-server
```

### Error: expo doctor failed
```bash
# Este error puede ignorarse si el resto del build funciona
# Es causado por tener carpetas android/ios en un proyecto Expo
# Si necesitas solucionarlo, añade a .gitignore:
/android
/ios
```

## Build Exitosa

Cuando la build sea exitosa verás:
```
Build successful
You can find the build artifacts in /home/leo/bite/app/build-1748967974325.apk
```