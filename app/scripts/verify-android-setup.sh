#!/bin/bash

# Verify Android development environment setup

echo "=== Android Development Environment Verification ==="
echo

# Check Java
echo "1. Java Installation:"
if command -v java &> /dev/null; then
    java -version
    echo "✓ Java is installed"
else
    echo "✗ Java is not installed or not in PATH"
fi
echo

# Check JAVA_HOME
echo "2. JAVA_HOME Environment Variable:"
if [ -n "$JAVA_HOME" ]; then
    echo "JAVA_HOME is set to: $JAVA_HOME"
    if [ -d "$JAVA_HOME" ]; then
        echo "✓ JAVA_HOME directory exists"
    else
        echo "✗ JAVA_HOME directory does not exist"
    fi
else
    echo "✗ JAVA_HOME is not set"
fi
echo

# Check Android SDK (if exists)
echo "3. Android SDK:"
if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    if [ -n "$ANDROID_HOME" ]; then
        echo "ANDROID_HOME is set to: $ANDROID_HOME"
    fi
    if [ -n "$ANDROID_SDK_ROOT" ]; then
        echo "ANDROID_SDK_ROOT is set to: $ANDROID_SDK_ROOT"
    fi
    echo "✓ Android SDK environment variables are set"
else
    echo "✗ Android SDK environment variables not set (this is OK if using EAS Build)"
fi
echo

# Check Node.js
echo "4. Node.js:"
if command -v node &> /dev/null; then
    echo "Node version: $(node --version)"
    echo "✓ Node.js is installed"
else
    echo "✗ Node.js is not installed"
fi
echo

# Check npm
echo "5. npm:"
if command -v npm &> /dev/null; then
    echo "npm version: $(npm --version)"
    echo "✓ npm is installed"
else
    echo "✗ npm is not installed"
fi
echo

# Check EAS CLI
echo "6. EAS CLI:"
if command -v eas &> /dev/null; then
    echo "EAS CLI version: $(eas --version)"
    echo "✓ EAS CLI is installed"
else
    echo "✗ EAS CLI is not installed"
    echo "  Install with: npm install -g eas-cli"
fi
echo

# Check Expo CLI
echo "7. Expo CLI:"
if npx expo --version &> /dev/null 2>&1; then
    echo "Expo CLI version: $(npx expo --version)"
    echo "✓ Expo CLI is available"
else
    echo "✗ Expo CLI is not available"
fi
echo

echo "=== Summary ==="
echo "Run the following commands to complete setup:"
echo "1. ./install-java.sh          # Install Java JDK 17"
echo "2. source ~/.bashrc           # Reload environment variables"
echo "3. ./fix-expo-packages.sh     # Fix Expo package versions"
echo "4. npm install -g eas-cli     # Install EAS CLI if needed"