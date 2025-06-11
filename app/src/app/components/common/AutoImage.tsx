import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Platform,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { Image, ImageProps as ExpoImageProps } from 'expo-image';
import { getCachedImageUri } from '../../lib/imageCache';
import { getImageUrl } from '../../lib/imageUtils';
import { useAppTheme } from '../../styles/theme';

export interface AutoImageProps
  extends Omit<ExpoImageProps, 'source' | 'style'> {
  source: string | null | undefined;
  maxWidth?: number;
  maxHeight?: number;
  useCache?: boolean;
  placeholder?: ExpoImageProps['placeholder'];
  contentFit?: ExpoImageProps['contentFit'];
  transition?: ExpoImageProps['transition'];
  style?: StyleProp<ViewStyle>;
}

function useAutoImageSize(
  maxWidth?: number,
  maxHeight?: number,
): { width?: number | string; height?: number | string } {
  return {
    width: maxWidth ?? '100%',
    height: maxHeight ?? '100%',
  };
}

export const AutoImage: React.FC<AutoImageProps> = ({
  source: originalSourceProp,
  maxWidth,
  maxHeight,
  useCache = true,
  style,
  placeholder,
  contentFit = 'cover',
  transition = 300,
  ...restExpoImageProps
}) => {
  const theme = useAppTheme();
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [isLoadingUri, setIsLoadingUri] = useState(true);

  const { width, height } = useAutoImageSize(maxWidth, maxHeight); // Eliminado argumento uri no usado

  useEffect(() => {
    let isMounted = true;
    setIsLoadingUri(true);
    setProcessedUri(null);

    if (!originalSourceProp) {
      if (isMounted) {
        setIsLoadingUri(false);
      }
      return;
    }

    const processSource = async () => {
      const fullRemoteUrl = getImageUrl(originalSourceProp);

      if (!fullRemoteUrl) {
        console.warn(
          `[AutoImage] No se pudo construir la URL para: ${originalSourceProp}`,
        );
        if (isMounted) setIsLoadingUri(false);
        return;
      }

      // Si NO se usa caché, o es web, o es una URI local, usar la URL construida directamente
      if (
        !useCache ||
        Platform.OS === 'web' ||
        fullRemoteUrl.startsWith('file://')
      ) {
        if (isMounted) {
          setProcessedUri(fullRemoteUrl);
          setIsLoadingUri(false);
        }
        return;
      }

      try {
        const cachedUri = await getCachedImageUri(fullRemoteUrl);
        if (isMounted) {
          setProcessedUri(cachedUri ?? fullRemoteUrl);
          setIsLoadingUri(false);
        }
      } catch (error) {
        console.error(
          `❌ [AutoImage] Error obteniendo imagen (${originalSourceProp}):`,
          error,
        );
        if (isMounted) {
          setProcessedUri(fullRemoteUrl);
          setIsLoadingUri(false);
        }
      }
    };

    processSource();

    return () => {
      isMounted = false;
    };
  }, [originalSourceProp, useCache]);

  const styles = StyleSheet.create({
    container: {
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
    },
    loadingIndicator: {
      position: 'absolute',
    },
    image: {
      width: '100%',
      height: '100%',
    },
  });

  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    { width: width as DimensionValue, height: height as DimensionValue },
    style,
  ];

  return (
    <View style={containerStyle}>
      {(isLoadingUri || !processedUri) && (
        <ActivityIndicator
          style={styles.loadingIndicator}
          animating={true}
          color={theme.colors.primary}
          size="small"
        />
      )}
      {!isLoadingUri && processedUri && (
        <Image
          source={{ uri: processedUri }}
          style={styles.image}
          placeholder={placeholder}
          contentFit={contentFit}
          transition={transition}
          {...restExpoImageProps}
        />
      )}
    </View>
  );
};

export default AutoImage;
