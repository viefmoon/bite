import { useEffect } from 'react';
import { Snackbar, Text } from 'react-native-paper';
import { StyleSheet, View, Modal } from 'react-native';
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={hideSnackbar}
    >
      <View style={styles.modalOverlay} pointerEvents="box-none">
        <View style={styles.snackbarContainer}>
          <Snackbar
            visible={true}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  snackbarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    elevation: 99999,
  },
  snackbar: {
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  messageText: {
    textAlign: 'center',
    width: '100%',
  },
});

export default GlobalSnackbar;
