import { useWindowDimensions, PixelRatio } from 'react-native';

interface ResponsiveFontConfig {
  baseSize?: number;
  minScale?: number;
  maxScale?: number;
}

/**
 * Hook para obtener un tamaño de fuente responsive basado en las dimensiones
 * de la pantalla y la densidad de píxeles del dispositivo.
 */
export const useResponsiveFontScale = (config: ResponsiveFontConfig = {}) => {
  const { width, height } = useWindowDimensions();
  const { minScale = 0.8, maxScale = 1.2 } = config;

  const pixelRatio = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();

  const screenSize = Math.min(width, height);

  const baseScreenSize = 360;

  let scale = screenSize / baseScreenSize;

  scale = Math.max(minScale, Math.min(maxScale, scale));

  scale = scale * fontScale;

  // En tablets, reducir ligeramente el escala para evitar fuentes muy grandes
  const isTablet = screenSize > 600;
  if (isTablet) {
    scale = scale * 0.85;
  }

  return {
    scale,
    fontSize: (size: number) => Math.round(size * scale),
    isTablet,
    screenSize,
    pixelRatio,
    fontScale,
  };
};

/**
 * Utilidad para obtener un tamaño de fuente responsive
 * Nota: Esta función no puede usar hooks, usar useResponsiveFontScale en su lugar
 */
export const getResponsiveFontSize = (
  baseSize: number,
  screenWidth?: number,
): number => {
  const fontScale = PixelRatio.getFontScale();

  const width = screenWidth || 360;

  const baseScreenWidth = 360;
  const scale = Math.min(1.2, Math.max(0.8, width / baseScreenWidth));

  return Math.round(baseSize * scale * fontScale);
};
