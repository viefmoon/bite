import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { ResponsiveModal } from '../responsive/ResponsiveModal';

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
  /** Preset de color para el botón de confirmación */
  confirmColorPreset?: 'primary' | 'error' | 'warning';
  /** Si se está procesando la confirmación */
  isConfirming?: boolean;
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
  confirmColorPreset = 'primary',
  isConfirming = false,
}: ConfirmationModalProps) => {
  const handleDismiss = () => {
    if (onDismiss) onDismiss();
    else if (onCancel) onCancel();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const handleConfirm = () => {
    onConfirm();
    // No cerrar el modal aquí - dejar que el componente padre lo maneje
  };

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={handleDismiss}
      maxWidthPercent={85}
      maxHeightPercent={40}
      title={title}
      dismissable={!isConfirming}
      isLoading={isConfirming}
      actions={[
        ...(onCancel
          ? [
              {
                label: cancelText,
                mode: 'outlined' as const,
                onPress: handleCancel,
                disabled: isConfirming,
                colorPreset: 'primary' as const,
              },
            ]
          : []),
        {
          label: confirmText,
          mode: confirmColorPreset === 'error' ? 'contained' as const : 'outlined' as const,
          onPress: handleConfirm,
          loading: isConfirming,
          colorPreset: confirmColorPreset,
          // Permitir color personalizado para compatibilidad
          ...(confirmButtonColor && { color: confirmButtonColor }),
        },
      ]}
    >
      <Text variant="bodyMedium" style={styles.message}>
        {message}
      </Text>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  message: {
    lineHeight: 22,
    textAlign: 'center',
  },
});

export default ConfirmationModal;
