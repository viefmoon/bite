#!/bin/bash

echo "=== Script de instalación de Java y corrección de errores para EAS Build ==="
echo ""

# 1. Instalar Java
echo "📦 Instalando OpenJDK 17..."
echo "Por favor, ingresa tu contraseña cuando se solicite:"
sudo apt update
sudo apt install -y openjdk-17-jdk

# 2. Configurar JAVA_HOME
echo ""
echo "🔧 Configurando variables de entorno..."

# Detectar la ubicación de Java
JAVA_PATH=$(update-java-alternatives -l | grep java-17 | awk '{print $3}')
if [ -z "$JAVA_PATH" ]; then
    JAVA_PATH="/usr/lib/jvm/java-17-openjdk-amd64"
fi

# Detectar shell
SHELL_CONFIG="$HOME/.bashrc"
if [ -n "$ZSH_VERSION" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
fi

# Agregar JAVA_HOME si no existe
if ! grep -q "JAVA_HOME" "$SHELL_CONFIG"; then
    echo "" >> "$SHELL_CONFIG"
    echo "# Java configuration" >> "$SHELL_CONFIG"
    echo "export JAVA_HOME=$JAVA_PATH" >> "$SHELL_CONFIG"
    echo "export PATH=\$PATH:\$JAVA_HOME/bin" >> "$SHELL_CONFIG"
fi

# También agregar a .profile para que funcione en todas las sesiones
if ! grep -q "JAVA_HOME" "$HOME/.profile"; then
    echo "" >> "$HOME/.profile"
    echo "# Java configuration" >> "$HOME/.profile"
    echo "export JAVA_HOME=$JAVA_PATH" >> "$HOME/.profile"
    echo "export PATH=\$PATH:\$JAVA_HOME/bin" >> "$HOME/.profile"
fi

# Exportar para la sesión actual
export JAVA_HOME=$JAVA_PATH
export PATH=$PATH:$JAVA_HOME/bin

# 3. Verificar instalación
echo ""
echo "✅ Verificando instalación de Java..."
java -version
echo "JAVA_HOME=$JAVA_HOME"

# 4. Actualizar paquetes de Expo (opcional)
echo ""
echo "📦 ¿Deseas actualizar los paquetes de Expo a las versiones recomendadas? (s/n)"
read -r response
if [[ "$response" == "s" || "$response" == "S" ]]; then
    echo "Actualizando paquetes..."
    npx expo install --fix
fi

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "⚠️  IMPORTANTE: Para que las variables de entorno funcionen, ejecuta:"
echo "    source $SHELL_CONFIG"
echo ""
echo "🚀 Luego puedes ejecutar tu build local con:"
echo "    npm run build:android:dev"