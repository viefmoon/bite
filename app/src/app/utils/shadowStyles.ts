import { Platform, ViewStyle } from 'react-native';

interface ShadowOptions {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * Genera estilos de sombra compatibles con web y móvil
 * @param options Opciones de sombra para React Native
 * @returns Estilos de sombra apropiados para la plataforma
 */
export function createShadowStyle(options: ShadowOptions): ViewStyle {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.25,
    shadowRadius = 3.84,
    elevation = 5,
  } = options;

  if (Platform.OS === 'web') {
    // Convertir valores de React Native a CSS box-shadow
    const offsetX = shadowOffset.width;
    const offsetY = shadowOffset.height;
    const blur = shadowRadius;

    // Convertir color hex a rgba con opacidad
    const color =
      shadowColor === '#000' || shadowColor === '#000000'
        ? `rgba(0, 0, 0, ${shadowOpacity})`
        : shadowColor.includes('rgba')
          ? shadowColor
          : `${shadowColor}${Math.round(shadowOpacity * 255)
              .toString(16)
              .padStart(2, '0')}`;

    return {
      boxShadow: `${offsetX}px ${offsetY}px ${blur}px ${color}`,
    } as any;
  }

  // Para móvil, devolver las propiedades nativas
  return {
    shadowColor,
    shadowOffset,
    shadowOpacity,
    shadowRadius,
    elevation,
  };
}

/**
 * Estilos de sombra predefinidos
 */
export const shadowPresets = {
  small: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  }),

  medium: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }),

  large: createShadowStyle({
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  }),

  none: Platform.select({
    web: { boxShadow: 'none' },
    default: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
  }) as ViewStyle,
};
