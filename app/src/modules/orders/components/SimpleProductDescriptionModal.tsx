import React, { useMemo } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Portal, Modal, Text, Title } from 'react-native-paper';
import type { Product } from '@/app/schemas/domain/product.schema';
import { useAppTheme } from '@/app/styles/theme';

interface SimpleProductDescriptionModalProps {
  visible: boolean;
  product: Product | null;
  onDismiss: () => void;
}

const SimpleProductDescriptionModal: React.FC<
  SimpleProductDescriptionModalProps
> = ({ visible, product, onDismiss }) => {
  const theme = useAppTheme();

  const styles = useMemo(() => StyleSheet.create({
    modal: {
      backgroundColor: theme.colors.background,
      margin: 20,
      padding: 20,
      borderRadius: 8,
      maxHeight: '60%',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.onBackground,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.onSurfaceVariant,
    },
  }), [theme]);

  if (!product || !product.description) return null;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Title style={styles.title}>{product.name}</Title>
          <Text style={styles.description}>{product.description}</Text>
        </ScrollView>
      </Modal>
    </Portal>
  );
};

export default SimpleProductDescriptionModal;
