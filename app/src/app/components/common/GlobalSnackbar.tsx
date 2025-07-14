import React, { useEffect } from 'react';
import Toast from 'react-native-root-toast';
import {
  useSnackbarStore,
  SnackbarType,
} from '../../../app/store/snackbarStore';
import { useAppTheme } from '../../../app/styles/theme';

const GlobalSnackbar: React.FC = () => {
  const { visible, message, type, duration, hideSnackbar } = useSnackbarStore();
  const theme = useAppTheme();

  useEffect(() => {
    if (visible && message) {
      const backgroundColor = getBackgroundColor(type);
      const textColor = getTextColor(type);

      const toast = Toast.show(message, {
        duration: duration || 2500,
        position: Toast.positions.BOTTOM,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor: backgroundColor,
        textColor: textColor,
        shadowColor: theme.colors.shadow,
        opacity: 0.95,
        containerStyle: {
          marginHorizontal: 16,
          marginBottom: 40,
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderRadius: theme.roundness,
          minHeight: 56,
          justifyContent: 'center',
          zIndex: 99999,
          elevation: 9999,
        },
        textStyle: {
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 24,
          textAlign: 'center',
        },
        onHidden: hideSnackbar,
      });

      // Limpiar el toast cuando se oculte el componente
      return () => {
        Toast.hide(toast);
      };
    }
  }, [
    visible,
    message,
    type,
    duration,
    hideSnackbar,
    theme.colors.shadow,
    theme.roundness,
  ]);

  const getBackgroundColor = (snackbarType: SnackbarType) => {
    switch (snackbarType) {
      case 'success':
        return theme.colors.successContainer;
      case 'error':
        return theme.colors.errorContainer;
      case 'warning':
        return theme.colors.warningContainer || theme.colors.tertiaryContainer;
      case 'info':
        return theme.colors.infoContainer || theme.colors.surfaceVariant;
      default:
        return theme.colors.inverseSurface;
    }
  };

  const getTextColor = (snackbarType: SnackbarType) => {
    const defaultTextColor = theme.dark
      ? theme.colors.surface
      : theme.colors.onSurface;

    switch (snackbarType) {
      case 'success':
        return theme.colors.onSuccessContainer || defaultTextColor;
      case 'error':
        return theme.colors.onErrorContainer;
      case 'warning':
        return (
          theme.colors.onWarningContainer || theme.colors.onTertiaryContainer
        );
      case 'info':
        return theme.colors.onInfoContainer || theme.colors.onSurfaceVariant;
      default:
        return theme.colors.inverseOnSurface;
    }
  };

  return null;
};

export default GlobalSnackbar;
