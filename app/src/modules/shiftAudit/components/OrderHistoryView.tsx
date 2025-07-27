import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useAppTheme } from '@/app/styles/theme';
import { OrderHistoryViewProps } from '../types/orderHistory';
import { OrderHistoryContent } from './OrderHistoryContent';
import { createStyles } from '../styles/orderHistoryStyles';

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  orderId,
  orderNumber,
  onBack,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const titleText = useMemo(
    () => `Historial de Orden #${orderNumber || ''}`,
    [orderNumber],
  );

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={onBack} />
        <Appbar.Content title={titleText} subtitle="Ver historial de cambios" />
      </Appbar.Header>

      <View style={styles.content}>
        <OrderHistoryContent
          orderId={orderId}
          orderNumber={orderNumber}
          showHeaderInfo={false} // Ya tenemos header en el Appbar
          contentContainerStyle={styles.listContent}
          emptyContainerStyle={styles.emptyContainer}
        />
      </View>
    </View>
  );
};
