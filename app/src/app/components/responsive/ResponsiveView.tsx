import React, { ReactNode, useMemo } from 'react';
import {
  View,
  ViewStyle,
  StyleProp,
  ViewProps,
  DimensionValue,
} from 'react-native';
import { useResponsive } from '@/app/hooks/useResponsive';

interface ResponsiveViewProps extends ViewProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;

  // Estilos responsivos por breakpoint
  xsStyle?: ViewStyle;
  smStyle?: ViewStyle;
  mdStyle?: ViewStyle;
  lgStyle?: ViewStyle;
  xlStyle?: ViewStyle;
  xxlStyle?: ViewStyle;

  // Estilos por tipo de dispositivo
  mobileStyle?: ViewStyle;
  tabletStyle?: ViewStyle;

  // Estilos por orientación
  portraitStyle?: ViewStyle;
  landscapeStyle?: ViewStyle;

  // Props de layout responsive
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  directionTablet?: 'row' | 'column' | 'row-reverse' | 'column-reverse';

  // Padding responsive
  padding?: number | 'auto';
  paddingHorizontal?: number | 'auto';
  paddingVertical?: number | 'auto';

  // Margin responsive
  margin?: number | 'auto';
  marginHorizontal?: number | 'auto';
  marginVertical?: number | 'auto';

  // Gap responsive (para flex)
  gap?: number | 'auto';
  gapTablet?: number;

  // Alignment responsive
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  alignTablet?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justify?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  justifyTablet?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';

  // Flex responsive
  flex?: number;
  flexTablet?: number;
  wrap?: boolean;
  wrapTablet?: boolean;

  // Dimensiones responsive
  width?: number | string | 'auto';
  widthTablet?: number | string | 'auto';
  height?: number | string | 'auto';
  heightTablet?: number | string | 'auto';

  // Max/Min dimensiones
  maxWidth?: number | string;
  maxWidthTablet?: number | string;
  maxHeight?: number | string;
  maxHeightTablet?: number | string;
  minWidth?: number | string;
  minWidthTablet?: number | string;
  minHeight?: number | string;
  minHeightTablet?: number | string;

  // Mostrar/Ocultar según dispositivo
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnPortrait?: boolean;
  hideOnLandscape?: boolean;
}

export const ResponsiveView: React.FC<ResponsiveViewProps> = ({
  children,
  style,

  // Estilos por breakpoint
  xsStyle,
  smStyle,
  mdStyle,
  lgStyle,
  xlStyle,
  xxlStyle,

  // Estilos por dispositivo
  mobileStyle,
  tabletStyle,

  // Estilos por orientación
  portraitStyle,
  landscapeStyle,

  // Props de layout
  direction = 'column',
  directionTablet,

  // Padding
  padding,
  paddingHorizontal,
  paddingVertical,

  // Margin
  margin,
  marginHorizontal,
  marginVertical,

  // Gap
  gap,
  gapTablet,

  // Alignment
  align,
  alignTablet,
  justify,
  justifyTablet,

  // Flex
  flex,
  flexTablet,
  wrap = false,
  wrapTablet,

  // Dimensiones
  width,
  widthTablet,
  height,
  heightTablet,

  // Max/Min
  maxWidth,
  maxWidthTablet,
  maxHeight,
  maxHeightTablet,
  minWidth,
  minWidthTablet,
  minHeight,
  minHeightTablet,

  // Visibility
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnPortrait = false,
  hideOnLandscape = false,

  ...restProps
}) => {
  const responsive = useResponsive();

  // Calcular estilos responsivos
  const responsiveStyles = useMemo(() => {
    // Ocultar según condiciones
    if (
      (hideOnMobile && responsive.isMobile) ||
      (hideOnTablet && responsive.isTablet) ||
      (hideOnPortrait && responsive.isPortrait) ||
      (hideOnLandscape && responsive.isLandscape)
    ) {
      return { display: 'none' } as ViewStyle;
    }

    // Base styles
    const baseStyle: ViewStyle = {
      // Dirección
      flexDirection:
        responsive.isTablet && directionTablet ? directionTablet : direction,

      // Flex
      flex: responsive.isTablet && flexTablet !== undefined ? flexTablet : flex,
      flexWrap:
        responsive.isTablet && wrapTablet !== undefined
          ? wrapTablet
            ? 'wrap'
            : 'nowrap'
          : wrap
            ? 'wrap'
            : 'nowrap',

      // Alignment
      alignItems: responsive.isTablet && alignTablet ? alignTablet : align,
      justifyContent:
        responsive.isTablet && justifyTablet ? justifyTablet : justify,

      // Dimensiones
      width: (responsive.isTablet && widthTablet !== undefined
        ? widthTablet
        : width) as any,
      height: (responsive.isTablet && heightTablet !== undefined
        ? heightTablet
        : height) as DimensionValue,

      // Max/Min
      maxWidth: (responsive.isTablet && maxWidthTablet !== undefined
        ? maxWidthTablet
        : maxWidth) as DimensionValue,
      maxHeight: (responsive.isTablet && maxHeightTablet !== undefined
        ? maxHeightTablet
        : maxHeight) as DimensionValue,
      minWidth: (responsive.isTablet && minWidthTablet !== undefined
        ? minWidthTablet
        : minWidth) as DimensionValue,
      minHeight: (responsive.isTablet && minHeightTablet !== undefined
        ? minHeightTablet
        : minHeight) as DimensionValue,
    };

    // Padding responsive
    if (padding !== undefined) {
      const paddingValue =
        padding === 'auto'
          ? responsive.spacingPreset.m
          : responsive.scaleWidth(padding);
      baseStyle.padding = paddingValue;
    }
    if (paddingHorizontal !== undefined) {
      const paddingValue =
        paddingHorizontal === 'auto'
          ? responsive.spacingPreset.m
          : responsive.scaleWidth(paddingHorizontal);
      baseStyle.paddingHorizontal = paddingValue;
    }
    if (paddingVertical !== undefined) {
      const paddingValue =
        paddingVertical === 'auto'
          ? responsive.spacingPreset.m
          : responsive.scaleHeight(paddingVertical);
      baseStyle.paddingVertical = paddingValue;
    }

    // Margin responsive
    if (margin !== undefined) {
      const marginValue =
        margin === 'auto'
          ? responsive.spacingPreset.m
          : responsive.scaleWidth(margin);
      baseStyle.margin = marginValue;
    }
    if (marginHorizontal !== undefined) {
      const marginValue =
        marginHorizontal === 'auto'
          ? responsive.spacingPreset.m
          : responsive.scaleWidth(marginHorizontal);
      baseStyle.marginHorizontal = marginValue;
    }
    if (marginVertical !== undefined) {
      const marginValue =
        marginVertical === 'auto'
          ? responsive.spacingPreset.m
          : responsive.scaleHeight(marginVertical);
      baseStyle.marginVertical = marginValue;
    }

    // Gap responsive
    if (gap !== undefined || gapTablet !== undefined) {
      const gapValue =
        responsive.isTablet && gapTablet !== undefined
          ? gapTablet
          : gap === 'auto'
            ? responsive.spacingPreset.m
            : gap;
      baseStyle.gap = responsive.scaleWidth(gapValue as number);
    }

    // Aplicar estilos por breakpoint
    const breakpointStyle = responsive.applyResponsiveStyle({
      xs: xsStyle,
      sm: smStyle,
      md: mdStyle,
      lg: lgStyle,
      xl: xlStyle,
      xxl: xxlStyle,
    });

    // Aplicar estilos por dispositivo
    const deviceStyle = responsive.isTablet ? tabletStyle : mobileStyle;

    // Aplicar estilos por orientación
    const orientationStyle = responsive.isPortrait
      ? portraitStyle
      : landscapeStyle;

    // Combinar todos los estilos
    return [
      baseStyle,
      breakpointStyle,
      deviceStyle,
      orientationStyle,
      style,
    ].filter(Boolean);
  }, [
    responsive,
    style,
    xsStyle,
    smStyle,
    mdStyle,
    lgStyle,
    xlStyle,
    xxlStyle,
    mobileStyle,
    tabletStyle,
    portraitStyle,
    landscapeStyle,
    direction,
    directionTablet,
    padding,
    paddingHorizontal,
    paddingVertical,
    margin,
    marginHorizontal,
    marginVertical,
    gap,
    gapTablet,
    align,
    alignTablet,
    justify,
    justifyTablet,
    flex,
    flexTablet,
    wrap,
    wrapTablet,
    width,
    widthTablet,
    height,
    heightTablet,
    maxWidth,
    maxWidthTablet,
    maxHeight,
    maxHeightTablet,
    minWidth,
    minWidthTablet,
    minHeight,
    minHeightTablet,
    hideOnMobile,
    hideOnTablet,
    hideOnPortrait,
    hideOnLandscape,
  ]);

  return (
    <View style={responsiveStyles} {...restProps}>
      {children}
    </View>
  );
};
