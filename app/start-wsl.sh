#!/bin/bash
# Script para desarrollo fácil desde WSL2 con modo Tunnel

echo "🚀 Iniciando desarrollo Expo desde WSL2..."
echo ""
echo "ℹ️  Usando modo Tunnel para evitar problemas de red WSL2"
echo ""
echo "Opciones disponibles:"
echo "1) Expo Go (más simple, algunas limitaciones)"
echo "2) Development Build (todas las features, requiere APK instalado)"
echo ""
read -p "Selecciona opción (1 o 2): " option

if [ "$option" = "1" ]; then
    echo "📱 Iniciando con Expo Go..."
    echo "Asegúrate de tener Expo Go instalado en tu dispositivo"
    echo "⏳ Creando túnel seguro..."
    npx expo start --tunnel
else
    echo "📱 Iniciando con Development Build..."
    echo ""
    echo "Requisitos:"
    echo "- APK de desarrollo instalado en tu dispositivo"
    echo ""
    read -p "¿El APK ya está instalado? (s/n): " installed
    
    if [ "$installed" = "n" ]; then
        echo ""
        echo "Para instalar el APK desde Windows PowerShell:"
        echo "adb install build-*.apk"
        echo ""
        echo "Presiona Enter cuando esté instalado..."
        read
    fi
    
    echo "⏳ Creando túnel seguro..."
    npx expo start --dev-client --tunnel
fi

echo ""
echo "✅ Servidor iniciado con túnel seguro!"
echo "📱 Escanea el código QR con tu dispositivo"
echo ""
echo "💡 Nota: El modo tunnel puede ser un poco más lento pero es más confiable desde WSL2"