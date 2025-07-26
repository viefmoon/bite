import React from 'react';
import { ResponsiveConfirmModal } from '../responsive/ResponsiveModal';

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
  // Determinar si es destructivo basado en el color del botón
  const destructive =
    confirmButtonColor &&
    (confirmButtonColor.includes('error') ||
      confirmButtonColor === '#f44336' ||
      confirmButtonColor === '#F44336' ||
      confirmButtonColor === 'error');

  return (
    <ResponsiveConfirmModal
      visible={visible}
      onDismiss={onDismiss || (() => {})}
      title={title}
      message={message}
      onConfirm={onConfirm}
      onCancel={onCancel}
      confirmText={confirmText}
      cancelText={cancelText}
      destructive={!!destructive}
      maxWidth={450}
      widthTablet="70%"
      widthMobile="90%"
    />
  );
};

export default ConfirmationModal;
