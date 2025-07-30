import { useEffect } from 'react';
import { Snackbar, Text, Portal } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useSnackbarStore, SnackbarType } from '@/app/stores/snackbarStore';
import { useAppTheme } from '@/app/styles/theme';

const GlobalSnackbar = () => {
  const { visible, message, type, duration, hideSnackbar } = useSnackbarStore();
  const theme = useAppTheme();

  useEffect(() => {
    if (visible && message) {
      const timer = setTimeout(() => {
        hideSnackbar();
      }, duration || 2500);

      return () => clearTimeout(timer);
    }
  }, [visible, message, duration, hideSnackbar]);

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

  const backgroundColor = getBackgroundColor(type);
  const textColor = getTextColor(type);

  if (!visible) return null;

  return (
    <Portal>
      <Snackbar
        visible={visible}
        onDismiss={hideSnackbar}
        duration={duration || 2500}
        style={[
          styles.snackbar,
          {
            backgroundColor,
          },
        ]}
        theme={{
          ...theme,
          colors: {
            ...theme.colors,
            inversePrimary: textColor,
            inverseOnSurface: textColor,
          },
        }}
      >
        <Text style={[styles.messageText, { color: textColor }]}>
          {message || ''}
        </Text>
      </Snackbar>
    </Portal>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    borderRadius: 8,
    zIndex: 99999,
  },
  messageText: {
    textAlign: 'center',
    width: '100%',
  },
});

export default GlobalSnackbar;
