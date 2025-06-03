import React from "react";
import { Portal, Dialog, Paragraph, Button } from "react-native-paper";
import { useAppTheme } from "@/app/styles/theme";
import { StyleSheet } from "react-native";

interface InfoModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  buttonText?: string;
}

const InfoModal: React.FC<InfoModalProps> = ({
  visible,
  title,
  message,
  onDismiss,
  buttonText = "Entendido",
}) => {
  const theme = useAppTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        dialog: {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.roundness * 2,
        },
        title: {
          color: theme.colors.onSurface,
        },
        paragraph: {
          color: theme.colors.onSurfaceVariant,
          lineHeight: 20,
        },
        actions: {
          justifyContent: "flex-end",
          paddingHorizontal: theme.spacing.m,
          paddingBottom: theme.spacing.m,
          paddingTop: theme.spacing.s,
        },
        button: {

        },
      }),
    [theme]
  );

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph style={styles.paragraph}>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onDismiss}
            mode="contained"
            style={styles.button}
          >
            {buttonText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default InfoModal;