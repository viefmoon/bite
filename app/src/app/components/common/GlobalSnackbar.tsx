import { useEffect } from 'react';
import { Snackbar, Portal, Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';
import { useSnackbarStore, SnackbarType } from '@/app/store/snackbarStore';
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
        <Text style={styles.messageText}>{message || ''}</Text>
      </Snackbar>
    </Portal>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginHorizontal: 16,
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    marginBottom: 40,
  },
  messageText: {
    textAlign: 'center',
    width: '100%',
  },
});

export default GlobalSnackbar;
