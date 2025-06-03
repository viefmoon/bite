#!/bin/bash

# Script con alternativas prácticas para instalar APK sin ADB

echo "📱 Alternativas para Instalar APK desde WSL2"
echo "==========================================="
echo ""

# Detectar la APK más reciente
APK_FILE=$(ls -t build-*.apk 2>/dev/null | head -n1)

if [ -z "$APK_FILE" ]; then
    echo "❌ No se encontró ningún archivo APK"
    echo "   Primero genera el APK con: npm run build:android:dev"
    exit 1
fi

echo "📦 APK encontrada: $APK_FILE"
echo "📏 Tamaño: $(du -h $APK_FILE | cut -f1)"
echo ""

# Detectar usuario de Windows
WIN_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r\n')
if [ -z "$WIN_USER" ]; then
    WIN_USER="TU_USUARIO"
fi

echo "🚀 MÉTODO 1: Copiar a Windows y compartir"
echo "-----------------------------------------"
echo "1. Copiar APK al escritorio de Windows:"
echo "   cp $APK_FILE /mnt/c/Users/$WIN_USER/Desktop/"
echo ""
echo "2. Opciones para transferir al móvil:"
echo "   a) WhatsApp Web: web.whatsapp.com"
echo "   b) Telegram Web: web.telegram.org"
echo "   c) Google Drive: drive.google.com"
echo "   d) OneDrive: onedrive.com"
echo "   e) Email a ti mismo"
echo ""

echo "🌐 MÉTODO 2: Servidor HTTP temporal"
echo "-----------------------------------"
echo "1. Ejecutar este comando para crear un servidor:"
echo "   python3 -m http.server 8000"
echo ""
echo "2. En tu móvil, abre el navegador y ve a:"
echo "   http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "3. Descarga el archivo APK"
echo ""

echo "📲 MÉTODO 3: Código QR"
echo "----------------------"
echo "1. Instalar qrencode (si no lo tienes):"
echo "   sudo apt install qrencode"
echo ""
echo "2. Generar QR con la URL del archivo:"
echo "   # Primero inicia el servidor HTTP"
echo "   python3 -m http.server 8000 &"
echo "   # Luego genera el QR"
echo "   echo \"http://$(hostname -I | awk '{print $1}'):8000/$APK_FILE\" | qrencode -o apk-qr.png"
echo "   # Ver el QR (requiere un visor de imágenes)"
echo ""

echo "🔧 MÉTODO 4: ADB sobre WiFi (si funciona)"
echo "-----------------------------------------"
echo "1. En Windows PowerShell (con USB conectado):"
echo "   adb tcpip 5555"
echo ""
echo "2. Desconecta el USB y en WSL2:"
echo "   adb connect [IP-del-móvil]:5555"
echo "   adb install $APK_FILE"
echo ""

echo "💡 MÉTODO 5: Subir a un servicio temporal"
echo "-----------------------------------------"
echo "Servicios gratuitos de compartición temporal:"
echo "- file.io (elimina después de 1 descarga)"
echo "- transfer.sh (línea de comandos)"
echo "- tmpfiles.org (temporal)"
echo ""
echo "Ejemplo con transfer.sh:"
echo "   curl --upload-file $APK_FILE https://transfer.sh/myapp.apk"
echo ""

echo "📌 Configuración en Android"
echo "---------------------------"
echo "Antes de instalar, en tu Android:"
echo "1. Ve a Configuración > Seguridad"
echo "2. Activa 'Fuentes desconocidas' o 'Instalar apps desconocidas'"
echo "3. Si es Android 8+, dale permiso al navegador/app que uses"
echo ""

# Función para copiar al escritorio
echo "🎯 Acción rápida: Copiar al escritorio de Windows"
echo "-------------------------------------------------"
if [ "$WIN_USER" != "TU_USUARIO" ]; then
    echo "¿Copiar $APK_FILE al escritorio? (s/n)"
    read -r response
    if [[ "$response" == "s" || "$response" == "S" ]]; then
        cp "$APK_FILE" "/mnt/c/Users/$WIN_USER/Desktop/"
        echo "✅ APK copiada a: C:\\Users\\$WIN_USER\\Desktop\\$APK_FILE"
        echo ""
        echo "Ahora puedes:"
        echo "1. Enviártela por WhatsApp/Telegram/Email"
        echo "2. Subirla a Drive/OneDrive"
        echo "3. Transferirla por USB"
    fi
fi

echo ""
echo "🚀 ¿Iniciar servidor HTTP ahora? (s/n)"
read -r response
if [[ "$response" == "s" || "$response" == "S" ]]; then
    echo ""
    echo "📡 Servidor HTTP iniciado en:"
    echo "   http://$(hostname -I | awk '{print $1}'):8000"
    echo ""
    echo "En tu móvil:"
    echo "1. Abre el navegador"
    echo "2. Ve a la URL de arriba"
    echo "3. Descarga $APK_FILE"
    echo ""
    echo "Presiona Ctrl+C para detener el servidor"
    python3 -m http.server 8000
fi