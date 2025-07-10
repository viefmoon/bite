import React, { useMemo } from 'react';
import { Image } from 'expo-image';
import { ImageProps } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';
import { useResponsive } from '@/app/hooks/useResponsive';

interface ResponsiveImageProps
  extends Omit<ImageProps, 'style' | 'width' | 'height'> {
  style?: StyleProp<ImageStyle>;

  // Dimensiones base
  width?: number;
  height?: number;

  // Dimensiones responsive
  widthMobile?: number;
  widthTablet?: number;
  heightMobile?: number;
  heightTablet?: number;

  // Dimensiones por orientación
  widthPortrait?: number;
  widthLandscape?: number;
  heightPortrait?: number;
  heightLandscape?: number;

  // Escalado automático
  autoScale?: boolean;
  minScale?: number;
  maxScale?: number;

  // Aspect ratio
  aspectRatio?: number;
  maintainAspectRatio?: boolean;

  // Tamaños predefinidos
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  sizeTablet?: 'small' | 'medium' | 'large' | 'xlarge';

  // Comportamiento responsive
  fillContainer?: boolean;
  maxWidth?: number | string;
  maxHeight?: number | string;
  minWidth?: number | string;
  minHeight?: number | string;

  // Optimización
  enableDPIScaling?: boolean;
  quality?: 'low' | 'medium' | 'high';
  qualityTablet?: 'low' | 'medium' | 'high';

  // Estilos condicionales
  mobileStyle?: StyleProp<ImageStyle>;
  tabletStyle?: StyleProp<ImageStyle>;
  portraitStyle?: StyleProp<ImageStyle>;
  landscapeStyle?: StyleProp<ImageStyle>;
}

// Tamaños predefinidos
const PREDEFINED_SIZES = {
  small: { mobile: 40, tablet: 48 },
  medium: { mobile: 80, tablet: 96 },
  large: { mobile: 120, tablet: 160 },
  xlarge: { mobile: 200, tablet: 280 },
};

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  style,

  // Dimensiones
  width,
  height,
  widthMobile,
  widthTablet,
  heightMobile,
  heightTablet,
  widthPortrait,
  widthLandscape,
  heightPortrait,
  heightLandscape,

  // Escalado
  autoScale = true,
  minScale = 0.8,
  maxScale = 1.5,

  // Aspect ratio
  aspectRatio,
  maintainAspectRatio = true,

  // Tamaños predefinidos
  size,
  sizeTablet,

  // Comportamiento
  fillContainer = false,
  maxWidth,
  maxHeight,
  minWidth,
  minHeight,

  // Optimización
  enableDPIScaling = true,
  quality = 'medium',
  qualityTablet,

  // Estilos condicionales
  mobileStyle,
  tabletStyle,
  portraitStyle,
  landscapeStyle,

  ...imageProps
}) => {
  const responsive = useResponsive();

  // Calcular dimensiones responsive
  const { responsiveWidth, responsiveHeight } = useMemo(() => {
    let finalWidth: number | undefined;
    let finalHeight: number | undefined;

    // Si se usa un tamaño predefinido
    if (size || sizeTablet) {
      const currentSize = responsive.isTablet && sizeTablet ? sizeTablet : size;
      if (currentSize) {
        const sizeValue = PREDEFINED_SIZES[currentSize];
        finalWidth = responsive.isTablet ? sizeValue.tablet : sizeValue.mobile;
        finalHeight = finalWidth; // Por defecto, las imágenes predefinidas son cuadradas
      }
    }

    // Dimensiones específicas por dispositivo
    if (responsive.isTablet) {
      finalWidth = widthTablet || width || finalWidth;
      finalHeight = heightTablet || height || finalHeight;
    } else {
      finalWidth = widthMobile || width || finalWidth;
      finalHeight = heightMobile || height || finalHeight;
    }

    // Dimensiones por orientación (tienen prioridad)
    if (responsive.isPortrait) {
      finalWidth = widthPortrait || finalWidth;
      finalHeight = heightPortrait || finalHeight;
    } else if (responsive.isLandscape) {
      finalWidth = widthLandscape || finalWidth;
      finalHeight = heightLandscape || finalHeight;
    }

    // Aplicar escalado automático si está habilitado
    if (autoScale && finalWidth) {
      finalWidth = responsive.scaleWithLimits(finalWidth, minScale, maxScale);
    }
    if (autoScale && finalHeight) {
      finalHeight = responsive.scaleWithLimits(finalHeight, minScale, maxScale);
    }

    // Mantener aspect ratio si es necesario
    if (maintainAspectRatio && aspectRatio && finalWidth && !finalHeight) {
      finalHeight = finalWidth / aspectRatio;
    } else if (
      maintainAspectRatio &&
      aspectRatio &&
      finalHeight &&
      !finalWidth
    ) {
      finalWidth = finalHeight * aspectRatio;
    }

    // Aplicar DPI scaling si está habilitado
    if (enableDPIScaling) {
      if (finalWidth) finalWidth = responsive.normalizeDPI(finalWidth);
      if (finalHeight) finalHeight = responsive.normalizeDPI(finalHeight);
    }

    return {
      responsiveWidth: finalWidth,
      responsiveHeight: finalHeight,
    };
  }, [
    width,
    height,
    widthMobile,
    widthTablet,
    heightMobile,
    heightTablet,
    widthPortrait,
    widthLandscape,
    heightPortrait,
    heightLandscape,
    size,
    sizeTablet,
    autoScale,
    minScale,
    maxScale,
    aspectRatio,
    maintainAspectRatio,
    enableDPIScaling,
    responsive,
  ]);

  // Calcular estilos responsive
  const responsiveStyles = useMemo(() => {
    const baseStyle: ImageStyle = {};

    // Aplicar dimensiones calculadas
    if (responsiveWidth) baseStyle.width = responsiveWidth;
    if (responsiveHeight) baseStyle.height = responsiveHeight;

    // Si fillContainer está activo
    if (fillContainer) {
      baseStyle.width = '100%';
      baseStyle.height = '100%';
    }

    // Aplicar límites
    if (maxWidth) baseStyle.maxWidth = maxWidth as any;
    if (maxHeight) baseStyle.maxHeight = maxHeight as any;
    if (minWidth) baseStyle.minWidth = minWidth as any;
    if (minHeight) baseStyle.minHeight = minHeight as any;

    // Aplicar aspect ratio si no hay altura definida
    if (aspectRatio && !responsiveHeight && !fillContainer) {
      baseStyle.aspectRatio = aspectRatio;
    }

    // Estilos condicionales por dispositivo
    const deviceStyle = responsive.isTablet ? tabletStyle : mobileStyle;

    // Estilos condicionales por orientación
    const orientationStyle = responsive.isPortrait
      ? portraitStyle
      : landscapeStyle;

    // Combinar todos los estilos
    return [baseStyle, deviceStyle, orientationStyle, style].filter(Boolean);
  }, [
    responsiveWidth,
    responsiveHeight,
    fillContainer,
    maxWidth,
    maxHeight,
    minWidth,
    minHeight,
    aspectRatio,
    mobileStyle,
    tabletStyle,
    portraitStyle,
    landscapeStyle,
    style,
    responsive,
  ]);

  // Props optimizadas para Image
  const optimizedImageProps = useMemo(() => {
    const props: Partial<ImageProps> = {
      ...imageProps,
      style: responsiveStyles,
      cachePolicy: 'memory-disk',
      priority: responsive.isTablet ? 'normal' : 'high',
      contentFit: imageProps.contentFit || 'cover',
    };

    // Solo aplicar quality si la fuente es una URI
    if (
      imageProps.source &&
      typeof imageProps.source === 'object' &&
      'uri' in imageProps.source
    ) {
      props.source = {
        ...imageProps.source,
        // La API de expo-image no soporta quality directamente,
        // pero podemos usar esto para futuras optimizaciones
      };
    }

    return props;
  }, [imageProps, responsiveStyles, responsive.isTablet]);

  return <Image {...optimizedImageProps} />;
};

// Componente helper para avatares responsive
export const ResponsiveAvatar: React.FC<
  ResponsiveImageProps & { rounded?: boolean }
> = ({ rounded = true, ...props }) => {
  const style: ImageStyle = rounded ? { borderRadius: 9999 } : {};

  return (
    <ResponsiveImage
      {...props}
      style={[style, props.style]}
      contentFit="cover"
      maintainAspectRatio={true}
      aspectRatio={1}
    />
  );
};

// Componente helper para thumbnails responsive
export const ResponsiveThumbnail: React.FC<ResponsiveImageProps> = (props) => {
  return (
    <ResponsiveImage
      size="medium"
      sizeTablet="large"
      contentFit="cover"
      enableDPIScaling={true}
      quality="medium"
      qualityTablet="high"
      {...props}
    />
  );
};
