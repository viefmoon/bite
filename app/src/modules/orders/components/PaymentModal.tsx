import React, { useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, Keyboard } from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  Divider,
  IconButton,
  Surface,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import { type PaymentMethod } from '../schema/payment.schema';
import { usePaymentModal } from '../hooks/usePaymentModal';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import ChangeCalculatorModal from './ChangeCalculatorModal';
import { PaymentSummary } from './PaymentSummary';
import { ExistingPaymentsList } from './ExistingPaymentsList';
import { NewPaymentForm } from './NewPaymentForm';
import { OrderStatusInfo } from '../utils/formatters';

interface PaymentModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId?: string; // Opcional para modo pre-pago
  orderTotal: number;
  orderNumber?: number;
  orderStatus?: string; // Estado de la orden
  onOrderCompleted?: () => void; // Callback cuando se completa la orden
  onPaymentRegistered?: () => void; // Callback cuando se registra un pago
  mode?: 'payment' | 'prepayment'; // Modo del modal
  onPrepaymentCreated?: (
    prepaymentId: string,
    amount: number,
    method: PaymentMethod,
  ) => void; // Callback para pre-pago
  existingPrepaymentId?: string; // ID del pre-pago existente para edición
  onPrepaymentDeleted?: () => void; // Callback para eliminar pre-pago
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderTotal,
  orderNumber,
  orderStatus,
  onOrderCompleted,
  onPaymentRegistered,
  mode = 'payment',
  onPrepaymentCreated,
  existingPrepaymentId,
  onPrepaymentDeleted,
}) => {
  const theme = useAppTheme();
  const responsive = useResponsive();
  const styles = useMemo(
    () => createStyles(theme, responsive),
    [theme, responsive],
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const amountInputRef = useRef<View>(null);

  const {
    // Estado
    selectedMethod,
    setSelectedMethod,
    amount,
    setAmount,
    showChangeCalculator,
    setShowChangeCalculator,
    showDeleteConfirm,
    showFinalizeConfirm,
    showDeletePrepaymentConfirm,
    keyboardVisible,
    isCreatingPrepayment,

    // Datos computados
    payments,
    isLoadingPayments,
    totalPaid,
    pendingAmount,
    isFullyPaid,

    // Mutaciones
    createPaymentMutation,
    deletePaymentMutation,
    completeOrderMutation,

    // Funciones
    handleSubmit,
    processPayment,
    handleDeletePayment,
    handleFinalizeOrder,
    handleDeletePrepayment,
    openDeleteConfirm,
    closeDeleteConfirm,
    openFinalizeConfirm,
    closeFinalizeConfirm,
    openDeletePrepaymentConfirm,
  } = usePaymentModal({
    visible,
    orderId,
    orderTotal,
    mode,
    existingPrepaymentId,
    onPaymentRegistered,
  });

  // Auto-scroll al mostrar teclado
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setTimeout(() => {
          if (amountInputRef.current && scrollViewRef.current) {
            amountInputRef.current.measureLayout(
              scrollViewRef.current as any,
              (_, y) => {
                scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
              },
              () => {},
            );
          }
        }, 100);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const handleProcessPayment = async () => {
    try {
      const result = await processPayment();

      if (mode === 'prepayment' && 'id' in result) {
        // Notificar al componente padre
        onPrepaymentCreated?.(result.id, amount || 0, selectedMethod);
        onDismiss();
      } else if (
        mode === 'payment' &&
        'shouldClose' in result &&
        result.shouldClose
      ) {
        onDismiss();
      }
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handleOrderFinalized = async () => {
    try {
      const success = await handleFinalizeOrder();
      if (success) {
        if (onOrderCompleted) {
          onOrderCompleted();
        } else {
          onDismiss();
        }
      }
    } catch (error) {
      // Error manejado por el hook
    }
  };

  const handlePrepaymentDeleted = async () => {
    try {
      const success = await handleDeletePrepayment();
      if (success) {
        onPrepaymentDeleted?.();
        onDismiss();
      }
    } catch (error) {
      // Error manejado por el hook
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible && !showChangeCalculator}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.modalWrapper}>
          <Surface style={styles.modalContent} elevation={3}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  {mode === 'prepayment' ? 'Registrar Pago' : 'Pagos'}
                </Text>
                {orderNumber && mode !== 'prepayment' && (
                  <Text style={styles.orderNumber}>Orden #{orderNumber}</Text>
                )}
                {mode === 'prepayment' && (
                  <Text style={styles.orderNumber}>Pago anticipado</Text>
                )}
              </View>
              <IconButton icon="close" size={24} onPress={onDismiss} />
            </View>

            <Divider />

            <ScrollView
              ref={scrollViewRef}
              style={[
                styles.scrollView,
                keyboardVisible && styles.scrollViewWithKeyboard,
              ]}
              contentContainerStyle={styles.scrollViewContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              bounces={true}
              nestedScrollEnabled={true}
            >
              {/* Resumen de pagos */}
              <PaymentSummary
                orderTotal={orderTotal}
                totalPaid={totalPaid}
                pendingAmount={pendingAmount}
                mode={mode}
              />

              {/* Lista de pagos existentes - Solo mostrar en modo payment */}
              {mode === 'payment' && (
                <ExistingPaymentsList
                  payments={payments}
                  isLoading={isLoadingPayments}
                  onDeletePayment={openDeleteConfirm}
                  isDeleting={deletePaymentMutation.isPending}
                />
              )}

              {/* Formulario para nuevo pago */}
              {(mode === 'prepayment' || !isFullyPaid) && (
                <View ref={amountInputRef}>
                  <NewPaymentForm
                    selectedMethod={selectedMethod}
                    onMethodChange={setSelectedMethod}
                    amount={amount}
                    onAmountChange={setAmount}
                    pendingAmount={pendingAmount}
                    mode={mode}
                    isLoading={
                      createPaymentMutation.isPending || isCreatingPrepayment
                    }
                  />
                </View>
              )}
            </ScrollView>

            {/* Botones de acción */}
            <View style={styles.footer}>
              <Button
                mode="outlined"
                onPress={onDismiss}
                style={[styles.footerButton, styles.cancelButton]}
                contentStyle={styles.footerButtonContent}
              >
                Cerrar
              </Button>
              {mode === 'prepayment' && existingPrepaymentId && (
                <Button
                  mode="outlined"
                  onPress={openDeletePrepaymentConfirm}
                  style={[styles.footerButton, styles.deleteButton]}
                  contentStyle={styles.footerButtonContent}
                  textColor={theme.colors.error}
                  icon="delete"
                >
                  Eliminar
                </Button>
              )}
              {(mode === 'prepayment' || !isFullyPaid) && (
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={
                    !amount ||
                    amount <= 0 ||
                    createPaymentMutation.isPending ||
                    isCreatingPrepayment
                  }
                  loading={
                    createPaymentMutation.isPending || isCreatingPrepayment
                  }
                  style={styles.footerButton}
                  contentStyle={styles.footerButtonContent}
                >
                  {mode === 'prepayment'
                    ? 'Registrar Pre-pago'
                    : 'Registrar Pago'}
                </Button>
              )}
              {isFullyPaid && mode !== 'prepayment' && (
                <Button
                  mode="contained"
                  onPress={openFinalizeConfirm}
                  disabled={completeOrderMutation.isPending}
                  loading={completeOrderMutation.isPending}
                  style={[styles.footerButton, styles.finalizeButton]}
                  contentStyle={styles.footerButtonContent}
                  icon="check-circle"
                >
                  Finalizar Orden
                </Button>
              )}
            </View>
          </Surface>
        </View>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        visible={showDeleteConfirm}
        onDismiss={closeDeleteConfirm}
        onCancel={closeDeleteConfirm}
        onConfirm={handleDeletePayment}
        title="Eliminar pago"
        message="¿Está seguro de que desea eliminar este pago? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="No, cancelar"
        confirmButtonColor={theme.colors.error}
      />

      {/* Modal de cálculo de cambio */}
      <ChangeCalculatorModal
        visible={showChangeCalculator}
        onDismiss={() => {
          setShowChangeCalculator(false);
        }}
        onConfirm={() => {
          setShowChangeCalculator(false);
          handleProcessPayment();
        }}
        amountToPay={amount || 0}
      />

      {/* Modal de confirmación para finalizar orden */}
      <ConfirmationModal
        visible={showFinalizeConfirm}
        onDismiss={closeFinalizeConfirm}
        onCancel={closeFinalizeConfirm}
        onConfirm={handleOrderFinalized}
        title="Finalizar orden"
        message={
          orderStatus && orderStatus !== 'READY'
            ? `⚠️ ADVERTENCIA: Esta orden está en estado "${OrderStatusInfo.getLabel(orderStatus)}" y no "Lista".\n\n¿Está seguro de que desea finalizar la orden #${orderNumber}? La orden se marcará como completada.`
            : `¿Está seguro de que desea finalizar la orden #${orderNumber}? La orden se marcará como completada.`
        }
        confirmText={
          orderStatus && orderStatus !== 'READY'
            ? 'Finalizar igual'
            : 'Sí, finalizar'
        }
        cancelText="No, cancelar"
        confirmButtonColor={
          orderStatus && orderStatus !== 'READY'
            ? theme.colors.error
            : '#10B981'
        }
      />

      {/* Modal de confirmación para eliminar pre-pago */}
      <ConfirmationModal
        visible={showDeletePrepaymentConfirm}
        onDismiss={() => {}}
        onCancel={() => {}}
        onConfirm={handlePrepaymentDeleted}
        title="Eliminar pago"
        message="¿Está seguro de que desea eliminar este pago registrado? Esta acción no se puede deshacer."
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        confirmButtonColor={theme.colors.error}
      />
    </Portal>
  );
};

const createStyles = (
  theme: AppTheme,
  responsive: ReturnType<typeof useResponsive>,
) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacingPreset.m,
    },
    modalWrapper: {
      width: '100%',
      maxWidth: responsive.isTablet ? 700 : 600,
      maxHeight: responsive.isTablet ? '90%' : '85%',
    },
    modalContent: {
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      width: '100%',
      maxHeight: '100%',
      minHeight: responsive.isTablet ? 550 : undefined,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: theme.colors.outline,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: responsive.spacingPreset.m,
      paddingVertical: responsive.spacingPreset.xs,
    },
    headerTextContainer: {
      flex: 1,
    },
    title: {
      ...theme.fonts.headlineSmall,
      fontSize: responsive.fontSize(theme.fonts.headlineSmall.fontSize),
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    orderNumber: {
      ...theme.fonts.bodyMedium,
      fontSize: responsive.fontSize(theme.fonts.bodyMedium.fontSize),
      color: theme.colors.onSurfaceVariant,
    },
    scrollView: {
      maxHeight: responsive.isTablet ? 600 : 500,
    },
    scrollViewContent: {
      paddingBottom: responsive.spacingPreset.m,
    },
    scrollViewWithKeyboard: {
      maxHeight: responsive.isTablet ? 350 : 250,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      paddingVertical: responsive.spacingPreset.s,
      paddingHorizontal: responsive.spacingPreset.m,
      marginHorizontal: responsive.spacingPreset.m,
      marginTop: responsive.spacingPreset.s,
      marginBottom: responsive.spacingPreset.m,
      borderRadius: theme.roundness,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.fontSize(theme.fonts.bodySmall.fontSize),
      color: theme.colors.onPrimaryContainer,
      opacity: 0.8,
      marginBottom: 2,
    },
    summaryAmount: {
      ...theme.fonts.titleSmall,
      fontSize: responsive.fontSize(theme.fonts.titleSmall.fontSize),
      fontWeight: 'bold',
      color: theme.colors.onPrimaryContainer,
    },
    summaryDividerVertical: {
      width: 1,
      height: '80%',
      backgroundColor: theme.colors.onPrimaryContainer,
      opacity: 0.2,
      marginHorizontal: responsive.spacingPreset.xs,
    },
    loader: {
      marginVertical: responsive.spacingPreset.xl,
    },
    paymentsSection: {
      paddingHorizontal: responsive.spacingPreset.m,
      paddingBottom: responsive.spacingPreset.s,
    },
    sectionTitle: {
      ...theme.fonts.titleSmall,
      fontSize: responsive.fontSize(theme.fonts.titleSmall.fontSize),
      color: theme.colors.onSurface,
      marginBottom: responsive.spacingPreset.xs,
      fontWeight: '600',
    },
    paymentItem: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      padding: responsive.spacingPreset.xs,
      marginBottom: responsive.spacingPreset.xs,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLeftInfo: {
      flex: 1,
    },
    paymentRightInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: responsive.spacingPreset.xs,
    },
    paymentMethodRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentMethodCompact: {
      ...theme.fonts.bodyMedium,
      fontSize: responsive.fontSize(theme.fonts.bodyMedium.fontSize),
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    paymentAmountCompact: {
      ...theme.fonts.bodyMedium,
      fontSize: responsive.fontSize(theme.fonts.bodyMedium.fontSize),
      fontWeight: 'bold',
      color: theme.colors.primary,
      minWidth: responsive.isTablet ? 60 : 70,
      textAlign: 'right',
    },
    paymentDateCompact: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.fontSize(theme.fonts.bodySmall.fontSize),
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    statusChipCompact: {
      height: responsive.isTablet ? 24 : 26,
      minWidth: responsive.isTablet ? 80 : 90,
    },
    statusChipTextCompact: {
      fontSize: responsive.fontSize(11),
      fontWeight: '600',
      color: 'white',
      lineHeight: responsive.isTablet ? 12 : 14,
    },
    deleteIconButton: {
      margin: 0,
      width: responsive.isTablet ? 32 : 36,
      height: responsive.isTablet ? 32 : 36,
    },
    formSection: {
      paddingHorizontal: responsive.spacingPreset.m,
      paddingBottom: responsive.spacingPreset.xs,
    },
    methodsContainer: {
      marginBottom: responsive.spacingPreset.s,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: responsive.spacingPreset.xs,
      paddingHorizontal: responsive.spacingPreset.s,
      marginBottom: responsive.spacingPreset.xs,
      borderRadius: theme.roundness,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    },
    methodCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    },
    methodText: {
      ...theme.fonts.bodyLarge,
      fontSize: responsive.fontSize(theme.fonts.bodyLarge.fontSize),
      color: theme.colors.onSurface,
      marginLeft: responsive.spacingPreset.xs,
    },
    methodTextSelected: {
      color: theme.colors.onPrimaryContainer,
      fontWeight: '500',
    },
    methodCardDisabled: {
      opacity: 0.5,
      borderColor: theme.colors.outlineVariant,
    },
    methodLabelContainer: {
      flex: 1,
      marginLeft: responsive.spacingPreset.xs,
    },
    methodTextDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    comingSoonText: {
      ...theme.fonts.bodySmall,
      fontSize: responsive.fontSize(theme.fonts.bodySmall.fontSize),
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
    amountContainer: {
      marginTop: responsive.spacingPreset.s,
    },
    amountRow: {
      flexDirection: 'row',
      gap: responsive.spacingPreset.xs,
      alignItems: 'flex-start',
    },
    amountInput: {
      backgroundColor: theme.colors.surface,
      flex: 1,
    },
    totalPendingButton: {
      marginTop: 4, // Alinear con el input que tiene un label
      height: responsive.isTablet ? 48 : 56, // Misma altura que el TextInput con outlined
      borderColor: theme.colors.primary,
      justifyContent: 'center',
    },
    totalPendingButtonContent: {
      height: '100%',
      paddingVertical: 0,
      paddingHorizontal: responsive.spacingPreset.s,
    },
    totalPendingButtonLabel: {
      fontSize: responsive.fontSize(13),
      lineHeight: responsive.isTablet ? 18 : 20,
      textAlignVertical: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: responsive.spacingPreset.m,
      paddingHorizontal: responsive.spacingPreset.m,
      paddingVertical: responsive.spacingPreset.m,
      paddingTop: responsive.spacingPreset.s,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    footerButton: {
      minWidth: responsive.isTablet ? 110 : 120,
    },
    footerButtonContent: {
      height: responsive.isTablet ? 36 : 40,
    },
    cancelButton: {
      borderColor: theme.colors.outline,
    },
    summaryAmountPaid: {
      color: '#4CAF50',
    },
    summaryLabelPending: {
      fontWeight: 'bold',
    },
    summaryAmountPendingBold: {
      fontWeight: 'bold',
    },
    summaryAmountError: {
      color: theme.colors.error,
    },
    finalizeButton: {
      backgroundColor: '#10B981',
    },
    deleteButton: {
      borderColor: theme.colors.error,
    },
  });

export default PaymentModal;
