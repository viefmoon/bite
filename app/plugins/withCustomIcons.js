const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Plugin para generar iconos personalizados
function withCustomIcons(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iconPath = path.join(projectRoot, 'assets', 'icon.png');
      const adaptiveIconPath = path.join(
        projectRoot,
        'assets',
        'adaptive-icon.png',
      );
      const splashPath = path.join(projectRoot, 'assets', 'splash.png');

      console.log('🎨 CloudBite Icon Plugin - Starting icon generation...');

      // Verificar que existen los iconos
      if (!fs.existsSync(iconPath)) {
        console.error('❌ Icon not found at:', iconPath);
        return config;
      }

      console.log('✅ Icon found at:', iconPath);

      // Durante el prebuild, los iconos ya son procesados por Expo
      // Este plugin solo sirve para logging y verificación
      console.log('📱 Icons will be processed during EAS build');

      // Para splash screen
      if (fs.existsSync(splashPath)) {
        console.log('✅ Splash screen found at:', splashPath);
      }

      // Para icono adaptativo
      if (fs.existsSync(adaptiveIconPath)) {
        console.log('✅ Adaptive icon found at:', adaptiveIconPath);
      }

      return config;
    },
  ]);
}

module.exports = withCustomIcons;
