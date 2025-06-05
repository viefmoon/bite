# Guía para Builds Locales con EAS

## Instalación Rápida (Scripts Automatizados)

Esta app incluye scripts automatizados para configurar todo el entorno necesario:

### 1. **Configuración Completa de Java y Expo**
```bash
cd app
./scripts/install-java.sh
source ~/.bashrc
```

### 2. **Instalación de Android SDK**
```bash
./scripts/install-android-sdk.sh
source ~/.bashrc
```

### 3. **Verificar el Entorno (Opcional)**
```bash
./scripts/verify-android-setup.sh  # Verifica la configuración
```

## Requisitos Previos (Instalación Manual)

### Para Android:

1. **Java Development Kit (JDK)**
   ```bash
   # Instalar OpenJDK 17 (recomendado para React Native)
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```

2. **Android SDK**
   - Opción 1: Usar el script automatizado `./scripts/install-android-sdk.sh`
   - Opción 2: Instalar manualmente:
   ```bash
   # Crear directorio para Android SDK
   mkdir -p ~/Android/Sdk
   cd ~/Android/Sdk
   
   # Descargar herramientas de línea de comandos
   wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
   unzip commandlinetools-linux-11076708_latest.zip
   mkdir -p cmdline-tools/latest
   mv cmdline-tools/* cmdline-tools/latest/
   ```

3. **Configurar variables de entorno**
   Agrega esto a tu `~/.bashrc` o `~/.zshrc`:
   ```bash
   export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
   export ANDROID_HOME=$HOME/Android/Sdk
   export ANDROID_SDK_ROOT=$HOME/Android/Sdk
   export PATH=$PATH:$JAVA_HOME/bin
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   export PATH=$PATH:$ANDROID_HOME/tools
   export PATH=$PATH:$ANDROID_HOME/tools/bin
   ```

4. **Instalar componentes de Android SDK**
   ```bash
   # Después de configurar las variables de entorno
   source ~/.bashrc  # o ~/.zshrc
   
   # Instalar componentes necesarios
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   sdkmanager "ndk;25.1.8937393"  # NDK necesario para React Native
   ```

5. **Configurar local.properties**
   ```bash
   echo "sdk.dir=$HOME/Android/Sdk" > android/local.properties
   ```

### Para iOS (solo en macOS):

1. **Xcode**
   - Instala desde App Store
   - Instala las herramientas de línea de comandos:
   ```bash
   xcode-select --install
   ```

2. **CocoaPods**
   ```bash
   sudo gem install cocoapods
   ```

## Construcción de Builds Locales

### Android

#### APK de Desarrollo (para pruebas):
```bash
cd app
npm run build:android:sim
```

#### APK para Dispositivo:
```bash
npm run build:android:dev
```

#### APK/AAB de Producción:
```bash
npm run build:android:prod
```

### iOS (solo en macOS)

#### Build para Simulador:
```bash
npm run build:ios:sim
```

#### Build para Dispositivo:
```bash
npm run build:ios:dev
```

#### Build de Producción:
```bash
npm run build:ios:prod
```

## Proceso de Build

1. **Primera vez**: EAS te pedirá autenticarte
   ```bash
   npx eas login
   ```

2. **Durante el build local**:
   - EAS descargará las herramientas necesarias
   - Compilará tu aplicación localmente
   - El archivo generado estará en la carpeta del proyecto

3. **Ubicación de los archivos generados**:
   - Android: `build-*.apk` o `build-*.aab`
   - iOS: `build-*.tar.gz` (contiene el .app o .ipa)

## Instalación en Dispositivos

### Android:

#### Instalar en Dispositivo Físico:
```bash
# 1. Habilita el modo desarrollador en tu dispositivo Android
# 2. Habilita la depuración USB
# 3. Conecta el dispositivo por USB
# 4. Verifica que el dispositivo esté conectado:
adb devices

# 5. Instalar el APK generado:
adb install build-*.apk
# o específicamente:
adb install build-1748967974325.apk
```

#### Instalar en Emulador:
```bash
# 1. Abrir emulador (si tienes Android Studio):
emulator -avd Pixel_6_API_34  # Reemplaza con el nombre de tu AVD

# 2. Instalar APK:
adb install build-*.apk
```

#### Ejecutar la App con Expo Dev Client:
```bash
# Una vez instalada la build de desarrollo, puedes ejecutar:
npm start

# Esto abrirá el servidor de desarrollo de Expo
# Escanea el código QR con la app instalada o presiona 'a' para Android
```

### iOS:
- Para simulador: Arrastra el .app al simulador
- Para dispositivo: Usa Xcode o herramientas como ios-deploy

## Solución de Problemas

### Error: "ANDROID_HOME not set"
Asegúrate de haber configurado las variables de entorno correctamente.

### Error: "SDK location not found"
Crea el archivo `local.properties` en `android/`:
```
sdk.dir=/home/tu-usuario/Android/Sdk
```

### Error de memoria durante el build
Aumenta la memoria de Gradle en `android/gradle.properties`:
```
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=1024m
```

## Notas Importantes

- Las builds locales requieren más recursos que las builds en la nube
- El primer build descargará muchas dependencias (puede tomar tiempo)
- Asegúrate de tener al menos 10GB de espacio libre
- Para producción, considera usar certificados y keystore apropiados