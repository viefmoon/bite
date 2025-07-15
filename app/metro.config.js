const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para asegurar que las peticiones HTTP funcionen en producción
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;