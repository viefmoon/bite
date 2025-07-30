import React, { useState, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton, ActivityIndicator } from 'react-native-paper';
import { Receipt } from '../schema/receipt.schema';
import { useAppTheme } from '@/app/styles/theme';
import { ResponsiveModal } from '@/app/components/responsive/ResponsiveModal';
import OrderHistoryModal from '@/modules/shared/components/OrderHistoryModal';
import { OrderDetailsView } from '@/modules/shared/components/OrderDetailsView';
import { mapReceiptToUnifiedOrder } from '@/modules/shared/mappers/order-mapper';

interface ReceiptDetailsModalProps {
  visible: boolean;
  onDismiss: () => void;
  receipt: Receipt | null;
  isLoading?: boolean;
}

export const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({
  visible,
  onDismiss,
  receipt,
  isLoading = false,
}) => {
  const theme = useAppTheme();
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  // Mapear los datos del receipt al formato unificado
  const unifiedOrder = useMemo(() => {
    if (!receipt) return null;
    return mapReceiptToUnifiedOrder(receipt);
  }, [receipt]);

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN':
        return '🍽️ Local';
      case 'TAKE_AWAY':
        return '🥡 Llevar';
      case 'DELIVERY':
        return '🚚 Envío';
      default:
        return type;
    }
  };

  const getPaymentStatus = () => {
    if (receipt?.payments && receipt.payments.length > 0) {
      const totalPaid = receipt.payments.reduce((sum, p) => sum + p.amount, 0);
      const totalAmount =
        typeof receipt.total === 'string'
          ? parseFloat(receipt.total)
          : receipt.total || 0;

      if (totalPaid >= totalAmount) {
        return { label: 'Pagado', color: '#10B981' };
      } else if (totalPaid > 0) {
        return { label: 'Parcial', color: '#F59E0B' };
      }
    }
    return { label: 'Pendiente', color: '#EF4444' };
  };

  if (isLoading || !receipt) {
    return (
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title="Cargando..."
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Cargando detalles del recibo...
          </Text>
        </View>
      </ResponsiveModal>
    );
  }

  const paymentStatus = getPaymentStatus();
  const modalTitle = `Recibo #${receipt?.shiftOrderNumber || ''} · ${getOrderTypeLabel(receipt?.orderType || '')}`;

  const footerContent = (
    <View style={styles.footer}>
      <View style={styles.footerLeft}>
        <Text
          style={[styles.totalLabel, { color: theme.colors.onSurfaceVariant }]}
        >
          Total:
        </Text>
        <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
          $
          {receipt
            ? typeof receipt.total === 'string'
              ? parseFloat(receipt.total).toFixed(2)
              : (receipt.total || 0).toFixed(2)
            : '0.00'}
        </Text>
      </View>
      <View
        style={[styles.paymentBadge, { backgroundColor: paymentStatus.color }]}
      >
        <Text style={styles.paymentBadgeText}>💵 {paymentStatus.label}</Text>
      </View>
    </View>
  );

  return (
    <>
      <ResponsiveModal
        visible={visible}
        onDismiss={onDismiss}
        title={modalTitle}
        maxHeightPercent={90}
        footer={footerContent}
      >
        {/* Botón de historial integrado */}
        <View style={styles.headerActionsContainer}>
          <IconButton
            icon="history"
            size={24}
            onPress={() => setShowOrderHistory(true)}
            style={styles.historyButton}
          />
        </View>

        {/* Usar el componente compartido para renderizar los detalles */}
        <OrderDetailsView
          order={unifiedOrder}
          isLoading={false} // Ya manejamos loading arriba
        />
      </ResponsiveModal>

      {/* Modal de historial de orden - funcionalidad específica del recibo */}
      {receipt && (
        <OrderHistoryModal
          visible={showOrderHistory}
          onDismiss={() => setShowOrderHistory(false)}
          orderId={receipt.id}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  historyButton: {
    margin: -8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  paymentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActionsContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
});
