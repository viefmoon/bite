import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Portal, Modal, Button } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';

interface ConfirmRecoverModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  orderNumber?: string;
}

export const ConfirmRecoverModal: React.FC<ConfirmRecoverModalProps> = ({
  visible,
  onClose,
  onConfirm,
  isLoading = false,
  orderNumber,
}) => {
  const theme = useAppTheme();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text variant="titleLarge" style={styles.title}>
          Recuperar Orden
        </Text>

        <Text variant="bodyMedium" style={styles.message}>
          ¿Estás seguro de que deseas recuperar la orden #{orderNumber}?
        </Text>

        <Text variant="bodySmall" style={styles.description}>
          La orden se marcará como entregada y volverá a estar visible en las
          órdenes activas.
        </Text>

        <View style={styles.actions}>
          <Button
            mode="text"
            onPress={onClose}
            disabled={isLoading}
            style={styles.button}
          >
            Cancelar
          </Button>
          <Button
            mode="contained"
            onPress={onConfirm}
            loading={isLoading}
            disabled={isLoading}
            style={styles.button}
          >
            Confirmar
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  message: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
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
