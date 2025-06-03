import React from "react";
import { Portal, Dialog, Paragraph, Button } from "react-native-paper";
import { useAppTheme } from "@/app/styles/theme";
import { StyleSheet } from "react-native";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}) => {
  const theme = useAppTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        dialog: {
          backgroundColor: theme.colors.background,
          borderRadius: 4,
        },
        title: {
          color: theme.colors.onSurface,
        },
        paragraph: {
          color: theme.colors.onSurfaceVariant,
        },
        actions: {
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 8,
          flexDirection: "row",
          gap: 16,
        },
        button: {
          flex: 1,
        },
        cancelButton: {
          backgroundColor: theme.colors.secondaryContainer,
        },
        confirmButton: {

        },
      }),
    [theme]
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph style={styles.paragraph}>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          {onCancel && (
            <Button
              onPress={onCancel}
              textColor={theme.colors.onSecondaryContainer}
              style={[styles.button, styles.cancelButton]}
            >
              {cancelText}
            </Button>
          )}
          <Button
            onPress={onConfirm}
            mode="contained"
            buttonColor={theme.colors.primary}
            style={[styles.button, styles.confirmButton]}
          >
            {confirmText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmationModal;
