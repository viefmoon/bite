import { Dimensions, PixelRatio } from 'react-native';

// Obtener dimensiones iniciales
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Breakpoints estándar
export const BREAKPOINTS = {
  xs: 0, // Extra pequeño (móviles pequeños)
  sm: 360, // Pequeño (móviles estándar)
  md: 600, // Mediano (móviles grandes y tablets pequeñas)
  lg: 900, // Grande (tablets)
  xl: 1200, // Extra grande (tablets grandes)
  xxl: 1536, // Doble extra grande (tablets pro)
} as const;

// Tipos de dispositivos
export const DEVICE_TYPES = {
  MOBILE_SMALL: 'mobile_small',
  MOBILE: 'mobile',
  TABLET_SMALL: 'tablet_small',
  TABLET: 'tablet',
  TABLET_LARGE: 'tablet_large',
} as const;

// Densidades de píxeles estándar
export const PIXEL_DENSITIES = {
  MDPI: 1, // ~160 DPI
  HDPI: 1.5, // ~240 DPI
  XHDPI: 2, // ~320 DPI
  XXHDPI: 3, // ~480 DPI
  XXXHDPI: 4, // ~640 DPI
} as const;

// Dimensiones de referencia para escalado
export const REFERENCE_DIMENSIONS = {
  width: 360, // Ancho de referencia (móvil estándar)
  height: 640, // Altura de referencia
} as const;

// Función para obtener el tipo de dispositivo
export const getDeviceType = (width: number = screenWidth): string => {
  if (width < BREAKPOINTS.sm) return DEVICE_TYPES.MOBILE_SMALL;
  if (width < BREAKPOINTS.md) return DEVICE_TYPES.MOBILE;
  if (width < BREAKPOINTS.lg) return DEVICE_TYPES.TABLET_SMALL;
  if (width < BREAKPOINTS.xl) return DEVICE_TYPES.TABLET;
  return DEVICE_TYPES.TABLET_LARGE;
};

// Función para verificar si es tablet
export const isTablet = (width: number = screenWidth): boolean => {
  return width >= BREAKPOINTS.md;
};

// Función para obtener el factor de escala basado en el ancho
export const getWidthScale = (width: number = screenWidth): number => {
  return width / REFERENCE_DIMENSIONS.width;
};

// Función para obtener el factor de escala basado en la altura
export const getHeightScale = (height: number = screenHeight): number => {
  return height / REFERENCE_DIMENSIONS.height;
};

// Función para escalar un valor según el ancho de pantalla
export const scaleWidth = (
  size: number,
  width: number = screenWidth,
): number => {
  const scale = getWidthScale(width);
  return Math.round(size * scale);
};

// Función para escalar un valor según la altura de pantalla
export const scaleHeight = (
  size: number,
  height: number = screenHeight,
): number => {
  const scale = getHeightScale(height);
  return Math.round(size * scale);
};

// Función para escalar con límites
export const scaleWithLimits = (
  size: number,
  minScale: number = 0.8,
  maxScale: number = 1.5,
  width: number = screenWidth,
): number => {
  const scale = Math.max(minScale, Math.min(maxScale, getWidthScale(width)));
  return Math.round(size * scale);
};

// Función para obtener dimensiones responsive
export const getResponsiveDimension = (
  mobile: number,
  tablet: number,
  width: number = screenWidth,
): number => {
  return isTablet(width) ? tablet : mobile;
};

// Escalas de spacing responsive (más espacioso en tablets para mejor legibilidad)
export const RESPONSIVE_SPACING = {
  xxxs: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(2, width) : scaleWidth(1, width),
  xxs: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(4, width) : scaleWidth(2, width),
  xs: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(6, width) : scaleWidth(4, width),
  s: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(10, width) : scaleWidth(8, width),
  m: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(16, width) : scaleWidth(16, width),
  l: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(24, width) : scaleWidth(24, width),
  xl: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(32, width) : scaleWidth(32, width),
  xxl: (width: number = screenWidth) =>
    isTablet(width) ? scaleWidth(40, width) : scaleWidth(40, width),
} as const;

// Tamaños de fuente responsive (optimizadas para tablets)
export const RESPONSIVE_FONT_SIZES = {
  xs: (width: number = screenWidth) =>
    isTablet(width) ? 10 : scaleWithLimits(10, 0.9, 1.1, width),
  s: (width: number = screenWidth) =>
    isTablet(width) ? 12 : scaleWithLimits(12, 0.9, 1.1, width),
  m: (width: number = screenWidth) =>
    isTablet(width) ? 14 : scaleWithLimits(14, 0.9, 1.2, width),
  l: (width: number = screenWidth) =>
    isTablet(width) ? 16 : scaleWithLimits(16, 0.9, 1.2, width),
  xl: (width: number = screenWidth) =>
    isTablet(width) ? 18 : scaleWithLimits(20, 0.9, 1.3, width),
  xxl: (width: number = screenWidth) =>
    isTablet(width) ? 22 : scaleWithLimits(24, 0.9, 1.3, width),
  xxxl: (width: number = screenWidth) =>
    isTablet(width) ? 28 : scaleWithLimits(32, 0.9, 1.4, width),
} as const;

// Dimensiones comunes responsive
export const RESPONSIVE_DIMENSIONS = {
  // Drawer
  drawerWidth: (width: number = screenWidth) => {
    if (width < BREAKPOINTS.sm) return 280;
    if (width < BREAKPOINTS.md) return 300;
    if (width < BREAKPOINTS.lg) return 340;
    if (width < BREAKPOINTS.xl) return 360;
    return 380;
  },

  // Modales
  modalWidth: (width: number = screenWidth) => {
    if (width < BREAKPOINTS.sm) return width * 0.95;
    if (width < BREAKPOINTS.md) return width * 0.85;
    if (width < BREAKPOINTS.lg) return Math.min(width * 0.6, 500);
    return Math.min(width * 0.45, 550);
  },

  // Headers
  headerHeight: (width: number = screenWidth) => {
    return getResponsiveDimension(56, 64, width);
  },

  // Botones
  buttonHeight: (width: number = screenWidth) => {
    return getResponsiveDimension(48, 44, width);
  },

  // Iconos
  iconSize: {
    small: (width: number = screenWidth) =>
      getResponsiveDimension(16, 16, width),
    medium: (width: number = screenWidth) =>
      getResponsiveDimension(24, 24, width),
    large: (width: number = screenWidth) =>
      getResponsiveDimension(32, 32, width),
  },

  // Imágenes de productos
  productImageSize: (width: number = screenWidth) => {
    if (width < BREAKPOINTS.sm) return 80;
    if (width < BREAKPOINTS.md) return 100;
    if (width < BREAKPOINTS.lg) return 90;
    return 100; // Más compacto en tablets
  },

  // Cards
  cardMinWidth: (width: number = screenWidth) => {
    if (width < BREAKPOINTS.sm) return width - 32;
    if (width < BREAKPOINTS.md) return 280;
    if (width < BREAKPOINTS.lg) return 320;
    return 360;
  },
} as const;

// Función helper para aplicar estilos condicionales según breakpoint
export const applyResponsiveStyle = <T>(
  width: number,
  styles: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    xxl?: T;
  },
): T | undefined => {
  const breakpoints = Object.keys(BREAKPOINTS).reverse() as Array<
    keyof typeof BREAKPOINTS
  >;

  for (const breakpoint of breakpoints) {
    if (width >= BREAKPOINTS[breakpoint] && styles[breakpoint]) {
      return styles[breakpoint];
    }
  }

  return undefined;
};

// Utilidad para calcular columnas en grids
export const getGridColumns = (
  width: number = screenWidth,
  minItemWidth: number = 150,
  gap: number = 16,
  padding: number = 16,
): number => {
  const availableWidth = width - padding * 2;
  const columns = Math.floor((availableWidth + gap) / (minItemWidth + gap));
  return Math.max(1, columns);
};

// Utilidad para obtener orientación safe
export const getOrientation = (
  width: number = screenWidth,
  height: number = screenHeight,
) => {
  return width > height ? 'landscape' : 'portrait';
};

// Utilidad para calcular aspect ratio
export const maintainAspectRatio = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
) => {
  const aspectRatio = originalWidth / originalHeight;

  let width = maxWidth;
  let height = maxWidth / aspectRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = maxHeight * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

// Exportar utilidad para normalizar según DPI
export const normalizeDPI = (size: number): number => {
  const pixelRatio = PixelRatio.get();
  return Math.round(size * pixelRatio) / pixelRatio;
};

// Utilidad para obtener dimensiones de pantalla actualizadas
export const getScreenDimensions = () => {
  return Dimensions.get('window');
};

// Multiplicador de densidad para tablets (más compacto)
export const TABLET_DENSITY_MULTIPLIER = 0.75;

// Helper para obtener tamaño compacto en tablets
export const getCompactSize = (
  mobileSize: number,
  width: number = screenWidth,
  compactRatio: number = TABLET_DENSITY_MULTIPLIER,
): number => {
  return isTablet(width) ? Math.round(mobileSize * compactRatio) : mobileSize;
};

// Helper para obtener tamaño de fuente compacto
export const getCompactFontSize = (
  mobileSize: number,
  width: number = screenWidth,
  compactRatio: number = 0.85,
): number => {
  return isTablet(width) ? Math.round(mobileSize * compactRatio) : mobileSize;
};

// Helper para obtener spacing compacto
export const getCompactSpacing = (
  mobileSpacing: number,
  width: number = screenWidth,
  compactRatio: number = 0.65,
): number => {
  return isTablet(width)
    ? Math.round(mobileSpacing * compactRatio)
    : mobileSpacing;
};
