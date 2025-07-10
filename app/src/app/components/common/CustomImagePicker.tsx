import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  IconButton,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { AppTheme } from '../../styles/theme';
import { useResponsive } from '../../hooks/useResponsive';

export interface FileObject {
  uri: string;
  name: string;
  type: string;
}

interface CustomImagePickerProps {
  value?: string | null;
  onImageSelected?: (imageUri: string, file: FileObject) => void;
  onImageRemoved?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: number;
  placeholderIcon?: string;
  placeholderText?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export const CustomImagePicker: React.FC<CustomImagePickerProps> = ({
  value,
  onImageSelected,
  onImageRemoved,
  style,
  size = 150,
  placeholderIcon = 'camera-plus-outline',
  placeholderText = 'Añadir imagen',
  isLoading = false,
  disabled = false,
}) => {
  const theme = useTheme<AppTheme>();
  const responsive = useResponsive();
  const [imageUri, setImageUri] = useState<string | null | undefined>(value);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
        if (isMounted) {
          setHasPermission(status === 'granted');
        }
      } catch {
        if (isMounted) {
          setHasPermission(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setImageUri(value);
    setImageLoadError(false);
  }, [value]);

  const requestPermission = async (): Promise<boolean> => {
    if (hasPermission) return true;
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
        return true;
      } else {
        Alert.alert(
          'Permiso requerido',
          'Se necesita acceso a la galería para seleccionar imágenes.',
        );
        setHasPermission(false);
        return false;
      }
    } catch (e) {
      Alert.alert(
        'Error',
        'No se pudieron solicitar los permisos de la galería.',
      );
      setHasPermission(false);
      return false;
    }
  };

  const handlePickImage = async () => {
    if (isLoading || disabled) return;

    const permissionGranted = await requestPermission();
    if (!permissionGranted) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const selectedUri = selectedAsset.uri;
        const fileName = selectedUri.split('/').pop() || 'image.jpg';
        const fileType =
          selectedAsset.mimeType ||
          (fileName.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg');

        const fileObject: FileObject = {
          uri: selectedUri,
          name: fileName,
          type: fileType,
        };
        setImageUri(selectedUri);
        onImageSelected?.(selectedUri, fileObject);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `No se pudo abrir la galería: ${error instanceof Error ? error.message : 'Inténtalo de nuevo.'}`,
      );
    }
  };

  const handleRemoveImage = () => {
    if (isLoading || disabled) return;
    setImageUri(null);
    onImageRemoved?.();
  };

  // Calcular tamaño responsive
  const responsiveSize = responsive.getResponsiveDimension(size, size * 1.2);

  const styles = StyleSheet.create({
    container: {
      width: responsiveSize,
      height: responsiveSize,
      borderRadius: theme.roundness * 1.5,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.colors.surfaceVariant,
    },
    touchable: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    placeholderContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing.s,
    },
    placeholderText: {
      marginTop: responsive.spacing.xs,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontSize: responsive.fontSize.s,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.roundness * 1.5,
    },
    removeButton: {
      position: 'absolute',
      top: responsive.spacing.xs,
      right: responsive.spacing.xs,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
  });

  return (
    <Surface style={[styles.container, style]} elevation={1}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePickImage}
        disabled={isLoading || disabled}
      >
        {imageUri && !imageLoadError ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            onError={() => setImageLoadError(true)}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <Avatar.Icon
              size={responsiveSize * 0.4}
              icon={placeholderIcon}
              style={{ backgroundColor: 'transparent' }}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.placeholderText} variant="bodySmall">
              {placeholderText}
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {imageUri && !imageLoadError && !isLoading && !disabled && (
          <IconButton
            icon="close-circle"
            size={responsive.dimensions.iconSize.medium}
            iconColor={theme.colors.onErrorContainer}
            style={styles.removeButton}
            onPress={handleRemoveImage}
            rippleColor="rgba(255, 255, 255, 0.32)"
          />
        )}
      </TouchableOpacity>
    </Surface>
  );
};

export default CustomImagePicker;
