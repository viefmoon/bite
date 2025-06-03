import React from "react";
import { StyleSheet } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import {
  useSnackbarStore,
  SnackbarType,
} from "../../../app/store/snackbarStore";
import { useAppTheme } from "../../../app/styles/theme";

const GlobalSnackbar: React.FC = () => {
  const { visible, message, type, duration, hideSnackbar } = useSnackbarStore();
  const theme = useAppTheme();

  const getSnackbarStyle = (snackbarType: SnackbarType) => {
    switch (snackbarType) {
      case "success":
        return { backgroundColor: theme.colors.successContainer };
      case "error":
        return { backgroundColor: theme.colors.errorContainer };
      case "warning":
        return { backgroundColor: theme.colors.warningContainer };
      case "info":
        return { backgroundColor: theme.colors.infoContainer };
      default:
        return {};
    }
  };

  const getSnackbarTextStyle = (snackbarType: SnackbarType) => {
    const defaultTextColor = theme.dark
      ? theme.colors.surface
      : theme.colors.onSurface;

    const baseStyle = {
      fontSize: 16,
      fontWeight: "500" as const,
      lineHeight: 24,
    };

    switch (snackbarType) {
      case "success":
        return {
          ...baseStyle,
          color: theme.colors.onSuccessContainer || defaultTextColor,
        };
      case "error":
        return {
          ...baseStyle,
          color: theme.colors.onErrorContainer,
        };
      case "warning":
        return {
          ...baseStyle,
          color: theme.colors.onWarningContainer || defaultTextColor,
        };
      case "info":
        return {
          ...baseStyle,
          color: theme.colors.onInfoContainer || defaultTextColor,
        };
      default:
        return {
          ...baseStyle,
          color: theme.colors.inverseOnSurface,
        };
    }
  };

  return (
    <Snackbar
      visible={visible}
      onDismiss={hideSnackbar}
      duration={duration}
      style={[styles.snackbarBase, getSnackbarStyle(type)]}
      theme={{ roundness: theme.roundness }}
    >
      <Text style={[styles.messageText, getSnackbarTextStyle(type)]}>
        {message}
      </Text>
    </Snackbar>
  );
};

const styles = StyleSheet.create({
  snackbarBase: {
    marginBottom: 16,
    marginHorizontal: 16,
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  messageText: {
    flex: 1,
    textAlign: "center",
  },
});

export default GlobalSnackbar;
