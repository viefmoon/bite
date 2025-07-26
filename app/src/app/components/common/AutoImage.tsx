import { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from 'react-native';
import { Platform } from 'react-native';
import { Image, ImageProps as ExpoImageProps } from 'expo-image';
import { Icon } from 'react-native-paper';
import { getCachedImageUri } from '../../lib/imageCache';
import { getImageUrlSync } from '../../lib/imageUtils';
import { serverConnectionService } from '@/services/serverConnectionService';
import { useAppTheme, AppTheme } from '../../styles/theme';

export interface AutoImageProps
  extends Omit<ExpoImageProps, 'source' | 'style'> {
  source: string | null | undefined;
  maxWidth?: number;
  maxHeight?: number;
  useCache?: boolean;
  placeholder?: ExpoImageProps['placeholder'];
  placeholderIcon?: string;
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
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

export const AutoImage = ({
  source: originalSourceProp,
  maxWidth,
  maxHeight,
  useCache = true,
  style,
  placeholder,
  placeholderIcon = 'image-off-outline',
  contentFit = 'cover',
  transition = 300,
  ...restExpoImageProps
}: AutoImageProps) => {
  const theme = useAppTheme();
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  const [isLoadingUri, setIsLoadingUri] = useState(true);

  const { width, height } = useAutoImageSize(maxWidth, maxHeight);

  const fullImageUrl = useMemo(() => {
    if (!originalSourceProp) return null;

    const serverUrl = serverConnectionService.getCurrentUrl();
    if (!serverUrl) return null;

    return getImageUrlSync(originalSourceProp, serverUrl);
  }, [originalSourceProp]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingUri(true);
    setProcessedUri(null);

    if (!fullImageUrl) {
      if (isMounted) {
        setIsLoadingUri(false);
      }
      return;
    }

    const processSource = async () => {
      // Si NO se usa caché, o es web, o es una URI local, usar la URL construida directamente
      if (
        !useCache ||
        Platform.OS === 'web' ||
        fullImageUrl.startsWith('file://')
      ) {
        if (isMounted) {
          setProcessedUri(fullImageUrl);
          setIsLoadingUri(false);
        }
        return;
      }

      try {
        const cachedUri = await getCachedImageUri(fullImageUrl);
        if (isMounted) {
          setProcessedUri(cachedUri ?? fullImageUrl);
          setIsLoadingUri(false);
        }
      } catch (error) {
        if (isMounted) {
          setProcessedUri(fullImageUrl);
          setIsLoadingUri(false);
        }
      }
    };

    processSource();

    return () => {
      isMounted = false;
    };
  }, [fullImageUrl, useCache]);

  const styles = useMemo(() => createStyles(theme), [theme]);

  const containerStyle: StyleProp<ViewStyle> = useMemo(
    () => [
      styles.container,
      { width: width as DimensionValue, height: height as DimensionValue },
      style,
    ],
    [styles, width, height, style],
  );

  const iconSize = useMemo(() => {
    if (typeof width === 'number' && typeof height === 'number') {
      return Math.min(width, height) * 0.4;
    }
    return 48; // Default size
  }, [width, height]);

  return (
    <View style={containerStyle}>
      {processedUri ? (
        <>
          <Image
            source={{ uri: processedUri }}
            style={styles.image}
            placeholder={placeholder}
            contentFit={contentFit}
            transition={transition}
            cachePolicy="memory-disk"
            {...restExpoImageProps}
          />
          {isLoadingUri && originalSourceProp && (
            <ActivityIndicator
              style={styles.loadingIndicator}
              animating={true}
              color={theme.colors.primary}
              size="small"
            />
          )}
        </>
      ) : (
        !isLoadingUri && (
          <Icon
            source={placeholderIcon}
            size={iconSize}
            color={theme.colors.onSurfaceVariant}
          />
        )
      )}
    </View>
  );
};

export default AutoImage;
