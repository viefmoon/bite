import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { ResponsiveModal } from '../responsive/ResponsiveModal';
import { useAppTheme } from '../../styles/theme';

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

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  onDismiss,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmButtonColor,
}: ConfirmationModalProps) => {
  const theme = useAppTheme();
  
  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    else if (onCancel) onCancel();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    handleDismiss();
  };

  const handleConfirm = () => {
    onConfirm();
    handleDismiss();
  };

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={handleDismiss}
      maxWidth={400}
      dismissable={true}
      scrollable={false}
    >
      <View style={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        
        <Text variant="bodyMedium" style={styles.message}>
          {message}
        </Text>
        
        <View style={styles.actions}>
          {onCancel && (
            <Button
              mode="text"
              onPress={handleCancel}
              style={styles.button}
            >
              {cancelText}
            </Button>
          )}
          
          <Button
            mode="contained"
            onPress={handleConfirm}
            style={[
              styles.button,
              confirmButtonColor && { backgroundColor: confirmButtonColor }
            ]}
            textColor={
              confirmButtonColor?.includes('error') 
                ? theme.colors.onError 
                : undefined
            }
          >
            {confirmText}
          </Button>
        </View>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: '600',
  },
  message: {
    marginBottom: 24,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 100,
  },
});

export default ConfirmationModal;
