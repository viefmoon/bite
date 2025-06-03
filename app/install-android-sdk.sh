#!/bin/bash

echo "=== Instalación de Android SDK para builds locales ==="
echo ""

# Crear directorio para Android SDK
ANDROID_SDK_ROOT="$HOME/Android/Sdk"
mkdir -p "$ANDROID_SDK_ROOT"

# Instalar unzip si no está instalado
if ! command -v unzip &> /dev/null; then
    echo "📦 Instalando unzip..."
    sudo apt install -y unzip
fi

# Descargar Android command line tools
if [ ! -d "$ANDROID_SDK_ROOT/cmdline-tools" ]; then
    echo "📦 Descargando Android Command Line Tools..."
    cd "$ANDROID_SDK_ROOT"
    
    # URL de las herramientas más recientes
    TOOLS_URL="https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
    
    echo "Descargando desde: $TOOLS_URL"
    wget -q --show-progress "$TOOLS_URL" -O cmdline-tools.zip
    
    echo "Extrayendo herramientas..."
    unzip -q cmdline-tools.zip
    
    # Reorganizar la estructura de directorios correctamente
    mkdir -p cmdline-tools/latest
    mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true
    
    # Limpiar
    rm -f cmdline-tools.zip
    
    echo "✅ Android Command Line Tools instaladas"
else
    echo "✅ Android Command Line Tools ya existen"
fi

# Configurar variables de entorno
echo ""
echo "🔧 Configurando variables de entorno..."

# Detectar shell
SHELL_CONFIG="$HOME/.bashrc"
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
fi

# Agregar ANDROID_HOME si no existe
if ! grep -q "ANDROID_HOME" "$SHELL_CONFIG"; then
    echo "" >> "$SHELL_CONFIG"
    echo "# Android SDK" >> "$SHELL_CONFIG"
    echo "export ANDROID_HOME=$ANDROID_SDK_ROOT" >> "$SHELL_CONFIG"
    echo "export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/emulator" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/platform-tools" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/tools" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$ANDROID_HOME/tools/bin" >> "$SHELL_CONFIG"
fi

# Exportar para la sesión actual
export ANDROID_HOME=$ANDROID_SDK_ROOT
export ANDROID_SDK_ROOT=$ANDROID_SDK_ROOT
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin

# Verificar que sdkmanager esté disponible
if ! command -v sdkmanager &> /dev/null; then
    echo "❌ Error: sdkmanager no se encuentra. Verificando instalación..."
    ls -la "$ANDROID_HOME/cmdline-tools/latest/bin/"
    exit 1
fi

echo ""
echo "📦 Instalando componentes de Android SDK..."
echo "Esto puede tomar varios minutos..."

# Aceptar licencias
yes | sdkmanager --licenses 2>/dev/null || true

# Instalar componentes esenciales
sdkmanager "platform-tools"
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "ndk;25.1.8937393"

# Crear/actualizar local.properties
echo ""
echo "📝 Actualizando local.properties..."
echo "sdk.dir=$ANDROID_SDK_ROOT" > "$HOME/bite/app/android/local.properties"

echo ""
echo "✅ ¡Android SDK instalado y configurado!"
echo ""
echo "📋 Resumen de la configuración:"
echo "   ANDROID_HOME=$ANDROID_HOME"
echo "   JAVA_HOME=$JAVA_HOME"
echo ""
echo "⚠️  IMPORTANTE: Ejecuta este comando para cargar las variables:"
echo "    source $SHELL_CONFIG"
echo ""
echo "🚀 Luego puedes ejecutar tu build con:"
echo "    npm run build:android:dev"