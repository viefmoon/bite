import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { Product } from '@/app/schemas/domain/product.schema';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';

interface SimpleProductDescriptionModalProps {
  visible: boolean;
  product: Product | null;
  onDismiss: () => void;
}

const SimpleProductDescriptionModal: React.FC<
  SimpleProductDescriptionModalProps
> = ({ visible, product, onDismiss }) => {
  const theme = useAppTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        description: {
          fontSize: 16,
          lineHeight: 24,
          color: theme.colors.onSurfaceVariant,
        },
      }),
    [theme],
  );

  if (!product || !product.description) return null;

  return (
    <ResponsiveModal
      visible={visible}
      onDismiss={onDismiss}
      maxWidthPercent={70}
      maxHeightPercent={60}
      title={product.name}
    >
      <Text style={styles.description}>{product.description}</Text>
    </ResponsiveModal>
  );
};

export default SimpleProductDescriptionModal;
