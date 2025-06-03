#!/bin/bash

# Script temporal para configurar JAVA_HOME si Java ya está instalado

# Buscar Java instalado
JAVA_EXEC=$(which java 2>/dev/null)

if [ -z "$JAVA_EXEC" ]; then
    echo "❌ Java no está instalado. Por favor ejecuta primero:"
    echo "   ./install-java-and-fix.sh"
    exit 1
fi

# Encontrar JAVA_HOME
if [ -x "/usr/libexec/java_home" ]; then
    # macOS
    export JAVA_HOME=$(/usr/libexec/java_home)
elif [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
    # Ubuntu/Debian con Java 17
    export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
elif [ -d "/usr/lib/jvm/java-11-openjdk-amd64" ]; then
    # Ubuntu/Debian con Java 11
    export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
else
    # Intentar detectar automáticamente
    JAVA_PATH=$(readlink -f $(which java))
    export JAVA_HOME=$(dirname $(dirname $JAVA_PATH))
fi

export PATH=$PATH:$JAVA_HOME/bin

echo "✅ Variables de entorno configuradas temporalmente:"
echo "   JAVA_HOME=$JAVA_HOME"
echo ""
echo "🚀 Ahora puedes ejecutar:"
echo "   npm run build:android:dev"