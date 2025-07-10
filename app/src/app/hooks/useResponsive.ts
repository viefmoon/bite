import { useState, useEffect, useCallback, useMemo } from 'react';
import { Dimensions, PixelRatio, ScaledSize } from 'react-native';
import {
  BREAKPOINTS,
  DEVICE_TYPES,
  getDeviceType,
  isTablet as checkIsTablet,
  scaleWidth,
  scaleHeight,
  scaleWithLimits,
  getResponsiveDimension,
  RESPONSIVE_SPACING,
  RESPONSIVE_FONT_SIZES,
  RESPONSIVE_DIMENSIONS,
  applyResponsiveStyle,
  getGridColumns,
  getOrientation as getOrientationUtil,
  maintainAspectRatio,
  normalizeDPI,
} from '@/app/styles/responsive';

interface ResponsiveInfo {
  // Dimensiones de pantalla
  width: number;
  height: number;

  // Información del dispositivo
  deviceType: string;
  isTablet: boolean;
  isMobile: boolean;
  isSmallMobile: boolean;

  // Orientación
  orientation: 'portrait' | 'landscape';
  isPortrait: boolean;
  isLandscape: boolean;

  // Densidad de píxeles
  pixelRatio: number;
  fontScale: number;

  // Funciones de escalado
  scaleWidth: (size: number) => number;
  scaleHeight: (size: number) => number;
  scaleWithLimits: (
    size: number,
    minScale?: number,
    maxScale?: number,
  ) => number;
  getResponsiveDimension: (mobile: number, tablet: number) => number;

  // Spacing responsive
  spacing: {
    xxxs: number;
    xxs: number;
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };

  // Tamaños de fuente responsive
  fontSize: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };

  // Dimensiones comunes
  dimensions: {
    drawerWidth: number;
    modalWidth: number;
    headerHeight: number;
    buttonHeight: number;
    iconSize: {
      small: number;
      medium: number;
      large: number;
    };
    productImageSize: number;
    cardMinWidth: number;
  };

  // Utilidades
  applyResponsiveStyle: <T>(styles: {
    xs?: T;
    sm?: T;
    md?: T;
    lg?: T;
    xl?: T;
    xxl?: T;
  }) => T | undefined;
  getGridColumns: (
    minItemWidth?: number,
    gap?: number,
    padding?: number,
  ) => number;
  maintainAspectRatio: (
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
  ) => { width: number; height: number };
  normalizeDPI: (size: number) => number;

  // Breakpoints
  breakpoints: typeof BREAKPOINTS;

  // Helpers de comparación
  isBreakpoint: {
    xs: boolean;
    sm: boolean;
    md: boolean;
    lg: boolean;
    xl: boolean;
    xxl: boolean;
  };
}

export const useResponsive = (): ResponsiveInfo => {
  // Estado para las dimensiones
  const [dimensions, setDimensions] = useState<ScaledSize>(() =>
    Dimensions.get('window'),
  );

  // Actualizar dimensiones cuando cambian
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  // Obtener información de píxeles
  const pixelRatio = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();

  // Calcular valores derivados
  const deviceType = useMemo(
    () => getDeviceType(dimensions.width),
    [dimensions.width],
  );
  const isTablet = useMemo(
    () => checkIsTablet(dimensions.width),
    [dimensions.width],
  );
  const isMobile = useMemo(() => !isTablet, [isTablet]);
  const isSmallMobile = useMemo(
    () => deviceType === DEVICE_TYPES.MOBILE_SMALL,
    [deviceType],
  );

  const orientation = useMemo(
    () => getOrientationUtil(dimensions.width, dimensions.height),
    [dimensions.width, dimensions.height],
  );
  const isPortrait = orientation === 'portrait';
  const isLandscape = orientation === 'landscape';

  // Funciones de escalado memoizadas
  const scaleWidthMemo = useCallback(
    (size: number) => scaleWidth(size, dimensions.width),
    [dimensions.width],
  );

  const scaleHeightMemo = useCallback(
    (size: number) => scaleHeight(size, dimensions.height),
    [dimensions.height],
  );

  const scaleWithLimitsMemo = useCallback(
    (size: number, minScale?: number, maxScale?: number) =>
      scaleWithLimits(size, minScale, maxScale, dimensions.width),
    [dimensions.width],
  );

  const getResponsiveDimensionMemo = useCallback(
    (mobile: number, tablet: number) =>
      getResponsiveDimension(mobile, tablet, dimensions.width),
    [dimensions.width],
  );

  // Spacing responsive
  const spacing = useMemo(
    () => ({
      xxxs: RESPONSIVE_SPACING.xxxs(dimensions.width),
      xxs: RESPONSIVE_SPACING.xxs(dimensions.width),
      xs: RESPONSIVE_SPACING.xs(dimensions.width),
      s: RESPONSIVE_SPACING.s(dimensions.width),
      m: RESPONSIVE_SPACING.m(dimensions.width),
      l: RESPONSIVE_SPACING.l(dimensions.width),
      xl: RESPONSIVE_SPACING.xl(dimensions.width),
      xxl: RESPONSIVE_SPACING.xxl(dimensions.width),
    }),
    [dimensions.width],
  );

  // Tamaños de fuente responsive
  const fontSize = useMemo(
    () => ({
      xs: RESPONSIVE_FONT_SIZES.xs(dimensions.width),
      s: RESPONSIVE_FONT_SIZES.s(dimensions.width),
      m: RESPONSIVE_FONT_SIZES.m(dimensions.width),
      l: RESPONSIVE_FONT_SIZES.l(dimensions.width),
      xl: RESPONSIVE_FONT_SIZES.xl(dimensions.width),
      xxl: RESPONSIVE_FONT_SIZES.xxl(dimensions.width),
      xxxl: RESPONSIVE_FONT_SIZES.xxxl(dimensions.width),
    }),
    [dimensions.width],
  );

  // Dimensiones comunes
  const commonDimensions = useMemo(
    () => ({
      drawerWidth: RESPONSIVE_DIMENSIONS.drawerWidth(dimensions.width),
      modalWidth: RESPONSIVE_DIMENSIONS.modalWidth(dimensions.width),
      headerHeight: RESPONSIVE_DIMENSIONS.headerHeight(dimensions.width),
      buttonHeight: RESPONSIVE_DIMENSIONS.buttonHeight(dimensions.width),
      iconSize: {
        small: RESPONSIVE_DIMENSIONS.iconSize.small(dimensions.width),
        medium: RESPONSIVE_DIMENSIONS.iconSize.medium(dimensions.width),
        large: RESPONSIVE_DIMENSIONS.iconSize.large(dimensions.width),
      },
      productImageSize: RESPONSIVE_DIMENSIONS.productImageSize(
        dimensions.width,
      ),
      cardMinWidth: RESPONSIVE_DIMENSIONS.cardMinWidth(dimensions.width),
    }),
    [dimensions.width],
  );

  // Aplicar estilos responsive
  const applyResponsiveStyleMemo = useCallback(
    <T>(styles: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; xxl?: T }) =>
      applyResponsiveStyle(dimensions.width, styles),
    [dimensions.width],
  );

  // Obtener columnas de grid
  const getGridColumnsMemo = useCallback(
    (minItemWidth?: number, gap?: number, padding?: number) =>
      getGridColumns(dimensions.width, minItemWidth, gap, padding),
    [dimensions.width],
  );

  // Helpers de breakpoint
  const isBreakpoint = useMemo(
    () => ({
      xs:
        dimensions.width >= BREAKPOINTS.xs && dimensions.width < BREAKPOINTS.sm,
      sm:
        dimensions.width >= BREAKPOINTS.sm && dimensions.width < BREAKPOINTS.md,
      md:
        dimensions.width >= BREAKPOINTS.md && dimensions.width < BREAKPOINTS.lg,
      lg:
        dimensions.width >= BREAKPOINTS.lg && dimensions.width < BREAKPOINTS.xl,
      xl:
        dimensions.width >= BREAKPOINTS.xl &&
        dimensions.width < BREAKPOINTS.xxl,
      xxl: dimensions.width >= BREAKPOINTS.xxl,
    }),
    [dimensions.width],
  );

  return {
    // Dimensiones
    width: dimensions.width,
    height: dimensions.height,

    // Información del dispositivo
    deviceType,
    isTablet,
    isMobile,
    isSmallMobile,

    // Orientación
    orientation,
    isPortrait,
    isLandscape,

    // Densidad de píxeles
    pixelRatio,
    fontScale,

    // Funciones de escalado
    scaleWidth: scaleWidthMemo,
    scaleHeight: scaleHeightMemo,
    scaleWithLimits: scaleWithLimitsMemo,
    getResponsiveDimension: getResponsiveDimensionMemo,

    // Spacing y dimensiones
    spacing,
    fontSize,
    dimensions: commonDimensions,

    // Utilidades
    applyResponsiveStyle: applyResponsiveStyleMemo,
    getGridColumns: getGridColumnsMemo,
    maintainAspectRatio,
    normalizeDPI,

    // Breakpoints
    breakpoints: BREAKPOINTS,
    isBreakpoint,
  };
};

// Hook adicional para estilos responsive con el tema
import { useAppTheme } from '@/app/styles/theme';

export const useResponsiveStyles = <T extends Record<string, any>>(
  styleFactory: (theme: any, responsive: ResponsiveInfo) => T,
): T => {
  const theme = useAppTheme();
  const responsive = useResponsive();

  return useMemo(
    () => styleFactory(theme, responsive),
    [theme, responsive, styleFactory],
  );
};
