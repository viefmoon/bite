import React from 'react';
import { Portal, Dialog, Paragraph, Button } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { StyleSheet } from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onDismiss?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  onDismiss,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonColor,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();

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
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 8,
          flexDirection: 'row',
          gap: 12,
        },
        button: {
          flex: 1,
          minHeight: responsive.isTablet ? 38 : 44,
        },
        buttonContent: {
          minHeight: responsive.isTablet ? 38 : 44,
          paddingHorizontal: responsive.spacing.s,
        },
        buttonLabel: {
          fontSize: responsive.isTablet ? 12 : 13,
          lineHeight: responsive.isTablet ? 16 : 18,
          textAlign: 'center',
        },
        cancelButton: {
          backgroundColor: theme.colors.secondaryContainer,
        },
        confirmButton: {},
      }),
    [theme, responsive],
  );

  return (
    <>
      {visible && (
        <Portal>
          <Dialog
            visible={visible}
            onDismiss={onDismiss || onCancel}
            style={styles.dialog}
          >
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
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  {cancelText}
                </Button>
              )}
              <Button
                onPress={onConfirm}
                mode="contained"
                buttonColor={confirmButtonColor || theme.colors.primary}
                style={[styles.button, styles.confirmButton]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                {confirmText}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </>
  );
};

export default ConfirmationModal;
