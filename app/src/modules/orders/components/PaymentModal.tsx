import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import {
  Modal,
  Portal,
  Text,
  Button,
  RadioButton,
  TextInput,
  HelperText,
  Divider,
  IconButton,
  Chip,
  ActivityIndicator,
  Surface,
} from 'react-native-paper';
import { useAppTheme, AppTheme } from '@/app/styles/theme';
import { useResponsive } from '@/app/hooks/useResponsive';
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
  type PaymentMethod,
} from '../schema/payment.schema';
import {
  useGetPaymentsByOrderIdQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
} from '../hooks/usePaymentQueries';
import { useCompleteOrderMutation } from '../hooks/useOrdersQueries';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import ChangeCalculatorModal from './ChangeCalculatorModal';
import { prepaymentService } from '@/modules/payments/services/prepaymentService';
import { OrderStatusInfo, formatPaymentMethod } from '../utils/formatters';

interface PaymentModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId?: string; // Opcional para modo pre-pago
  orderTotal: number;
  orderNumber?: number;
  orderStatus?: string; // Estado de la orden
  onOrderCompleted?: () => void; // Callback cuando se completa la orden
  mode?: 'payment' | 'prepayment'; // Modo del modal
  onPrepaymentCreated?: (
    prepaymentId: string,
    amount: number,
    method: PaymentMethod,
  ) => void; // Callback para pre-pago
  existingPrepaymentId?: string; // ID del pre-pago existente para edición
  onPrepaymentDeleted?: () => void; // Callback para eliminar pre-pago
}

// Métodos de pago deshabilitados temporalmente
const DISABLED_METHODS: PaymentMethod[] = ['CARD', 'TRANSFER'];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderTotal,
  orderNumber,
  orderStatus,
  onOrderCompleted,
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

  // Estado del formulario
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    PaymentMethodEnum.CASH,
  );
  const [amount, setAmount] = useState('');
  const [showChangeCalculator, setShowChangeCalculator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [isCreatingPrepayment, setIsCreatingPrepayment] = useState(false);
  const [showDeletePrepaymentConfirm, setShowDeletePrepaymentConfirm] =
    useState(false);

  // Queries y mutations (solo para modo payment)
  const { data: payments = [], isLoading: isLoadingPayments } =
    useGetPaymentsByOrderIdQuery(orderId || '', {
      enabled: mode === 'payment' && !!orderId,
    });
  const createPaymentMutation = useCreatePaymentMutation();
  const deletePaymentMutation = useDeletePaymentMutation();
  const completeOrderMutation = useCompleteOrderMutation();

  // Calcular totales
  const totalPaid = useMemo(() => {
    if (mode === 'prepayment') {
      return 0; // En modo pre-pago, no hay pagos previos
    }
    return (payments || [])
      .filter((p) => p.paymentStatus === PaymentStatusEnum.COMPLETED)
      .reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
  }, [payments, mode]);

  const pendingAmount = orderTotal - totalPaid;
  const isFullyPaid = pendingAmount <= 0;

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (visible) {
      if (mode === 'prepayment') {
        setAmount(orderTotal.toFixed(2));
      } else {
        setAmount(pendingAmount > 0 ? pendingAmount.toFixed(2) : '');
      }
      setShowChangeCalculator(false);
      setSelectedMethod(PaymentMethodEnum.CASH);
    }
  }, [visible, pendingAmount, orderTotal, mode]);

  // Manejar el teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        // Pequeño delay para asegurar que el layout esté actualizado
        setTimeout(() => {
          if (amountInputRef.current && scrollViewRef.current) {
            amountInputRef.current.measureLayout(
              scrollViewRef.current as any,
              (x, y) => {
                scrollViewRef.current?.scrollTo({ y: y - 50, animated: true });
              },
              () => {},
            );
          }
        }, 100);
      },
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    // Si es efectivo, mostrar calculadora de cambio
    if (selectedMethod === PaymentMethodEnum.CASH) {
      setShowChangeCalculator(true);
      return;
    }

    // Para otros métodos de pago, procesar directamente
    await processPayment();
  };

  const processPayment = async () => {
    const parsedAmount = parseFloat(amount);

    try {
      if (mode === 'prepayment') {
        // Crear pre-pago
        setIsCreatingPrepayment(true);
        const prepayment = await prepaymentService.createPrepayment({
          paymentMethod: selectedMethod,
          amount: parsedAmount,
        });

        // Notificar al componente padre
        onPrepaymentCreated?.(prepayment.id, parsedAmount, selectedMethod);

        // Cerrar el modal
        onDismiss();
      } else {
        // Crear pago normal
        await createPaymentMutation.mutateAsync({
          orderId: orderId!,
          paymentMethod: selectedMethod,
          amount: parsedAmount,
        });

        // Resetear formulario
        setAmount('');
        setShowChangeCalculator(false);

        // Si ya está totalmente pagado, cerrar el modal
        if (pendingAmount - parsedAmount <= 0) {
          onDismiss();
        }
      }
    } catch (error) {
      // Error ya manejado por el mutation hook
    } finally {
      setIsCreatingPrepayment(false);
    }
  };

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;

    try {
      await deletePaymentMutation.mutateAsync(paymentToDelete);
      setShowDeleteConfirm(false);
      setPaymentToDelete(null);
    } catch (error) {}
  };

  const handleFinalizeOrder = async () => {
    try {
      await completeOrderMutation.mutateAsync(orderId);
      setShowFinalizeConfirm(false);

      // Llamar al callback si existe
      if (onOrderCompleted) {
        onOrderCompleted();
      } else {
        // Si no hay callback, solo cerrar el modal
        onDismiss();
      }
    } catch (error) {}
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case PaymentStatusEnum.COMPLETED:
        return '#4CAF50';
      case PaymentStatusEnum.PENDING:
        return theme.colors.primary;
      case PaymentStatusEnum.CANCELLED:
        return theme.colors.error;
      case PaymentStatusEnum.FAILED:
        return theme.colors.error;
      case PaymentStatusEnum.REFUNDED:
        return '#FF9800';
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case PaymentStatusEnum.COMPLETED:
        return 'Completado';
      case PaymentStatusEnum.PENDING:
        return 'Pendiente';
      case PaymentStatusEnum.CANCELLED:
        return 'Cancelado';
      case PaymentStatusEnum.FAILED:
        return 'Fallido';
      case PaymentStatusEnum.REFUNDED:
        return 'Reembolsado';
      default:
        return status;
    }
  };

  const handleDeletePrepayment = async () => {
    if (!existingPrepaymentId) return;

    try {
      setIsCreatingPrepayment(true);
      await prepaymentService.deletePrepayment(existingPrepaymentId);
      onPrepaymentDeleted?.();
      setShowDeletePrepaymentConfirm(false);
      onDismiss();
    } catch (error) {
      // Error manejado en el servicio
    } finally {
      setIsCreatingPrepayment(false);
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
              <View style={styles.summaryContainer}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryAmount}>
                    ${orderTotal.toFixed(2)}
                  </Text>
                </View>
                {mode !== 'prepayment' && (
                  <>
                    <View style={styles.summaryDividerVertical} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Pagado</Text>
                      <Text
                        style={[styles.summaryAmount, styles.summaryAmountPaid]}
                      >
                        ${totalPaid.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryDividerVertical} />
                    <View style={styles.summaryItem}>
                      <Text
                        style={[
                          styles.summaryLabel,
                          styles.summaryLabelPending,
                        ]}
                      >
                        Pendiente
                      </Text>
                      <Text
                        style={[
                          styles.summaryAmount,
                          styles.summaryAmountPendingBold,
                          pendingAmount > 0
                            ? styles.summaryAmountError
                            : styles.summaryAmountPaid,
                        ]}
                      >
                        ${pendingAmount.toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Lista de pagos existentes - Solo mostrar en modo payment */}
              {mode === 'payment' && (
                <>
                  {isLoadingPayments ? (
                    <ActivityIndicator style={styles.loader} />
                  ) : (payments || []).length > 0 ? (
                    <View style={styles.paymentsSection}>
                      <Text style={styles.sectionTitle}>Pagos registrados</Text>
                      {(payments || []).map((payment) => (
                        <View key={payment.id} style={styles.paymentItem}>
                          <View style={styles.paymentLeftInfo}>
                            <View style={styles.paymentMethodRow}>
                              <Text style={styles.paymentMethodCompact}>
                                {formatPaymentMethod(payment.paymentMethod)}
                              </Text>
                            </View>
                            <Text style={styles.paymentDateCompact}>
                              {new Date(payment.createdAt).toLocaleTimeString(
                                'es-MX',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                },
                              )}
                            </Text>
                          </View>

                          <View style={styles.paymentRightInfo}>
                            <Text style={styles.paymentAmountCompact}>
                              ${(Number(payment.amount) || 0).toFixed(2)}
                            </Text>

                            <Chip
                              mode="flat"
                              style={[
                                styles.statusChipCompact,
                                {
                                  backgroundColor: getStatusColor(
                                    payment.paymentStatus,
                                  ),
                                },
                              ]}
                              textStyle={styles.statusChipTextCompact}
                            >
                              {getStatusText(payment.paymentStatus)}
                            </Chip>

                            <IconButton
                              icon="delete"
                              size={20}
                              iconColor={theme.colors.error}
                              onPress={() => {
                                setPaymentToDelete(payment.id);
                                setShowDeleteConfirm(true);
                              }}
                              disabled={deletePaymentMutation.isPending}
                              style={styles.deleteIconButton}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </>
              )}

              {/* Formulario para nuevo pago */}
              {(mode === 'prepayment' || !isFullyPaid) && (
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>
                    {mode === 'prepayment'
                      ? 'Configurar pago'
                      : 'Registrar nuevo pago'}
                  </Text>

                  {/* Métodos de pago */}
                  <View style={styles.methodsContainer}>
                    {Object.entries(PaymentMethodEnum).map(([key, value]) => {
                      const isDisabled = DISABLED_METHODS.includes(
                        value as PaymentMethod,
                      );
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[
                            styles.methodCard,
                            selectedMethod === value &&
                              styles.methodCardSelected,
                            isDisabled && styles.methodCardDisabled,
                          ]}
                          onPress={() =>
                            !isDisabled && setSelectedMethod(value)
                          }
                          disabled={isDisabled}
                        >
                          <RadioButton
                            value={value}
                            status={
                              selectedMethod === value ? 'checked' : 'unchecked'
                            }
                            onPress={() =>
                              !isDisabled && setSelectedMethod(value)
                            }
                            disabled={isDisabled}
                          />
                          <View style={styles.methodLabelContainer}>
                            <Text
                              style={[
                                styles.methodText,
                                selectedMethod === value &&
                                  styles.methodTextSelected,
                                isDisabled && styles.methodTextDisabled,
                              ]}
                            >
                              {formatPaymentMethod(value)}
                            </Text>
                            {isDisabled && (
                              <Text style={styles.comingSoonText}>
                                Próximamente
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Campo de monto */}
                  <View style={styles.amountContainer} ref={amountInputRef}>
                    <View style={styles.amountRow}>
                      <TextInput
                        label="Monto a pagar"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        mode="outlined"
                        left={<TextInput.Affix text="$" />}
                        style={styles.amountInput}
                        error={
                          amount !== '' &&
                          (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
                        }
                      />
                      <Button
                        mode="outlined"
                        onPress={() => setAmount(pendingAmount.toFixed(2))}
                        style={styles.totalPendingButton}
                        labelStyle={styles.totalPendingButtonLabel}
                        contentStyle={styles.totalPendingButtonContent}
                        compact
                      >
                        Total a pagar
                      </Button>
                    </View>
                    <HelperText
                      type="error"
                      visible={
                        amount !== '' &&
                        (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
                      }
                    >
                      Ingrese un monto válido
                    </HelperText>
                  </View>
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
                  onPress={() => setShowDeletePrepaymentConfirm(true)}
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
                    isNaN(parseFloat(amount)) ||
                    parseFloat(amount) <= 0 ||
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
                  onPress={() => setShowFinalizeConfirm(true)}
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
        onDismiss={() => {
          setShowDeleteConfirm(false);
          setPaymentToDelete(null);
        }}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPaymentToDelete(null);
        }}
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
          processPayment();
        }}
        amountToPay={parseFloat(amount) || 0}
      />

      {/* Modal de confirmación para finalizar orden */}
      <ConfirmationModal
        visible={showFinalizeConfirm}
        onDismiss={() => setShowFinalizeConfirm(false)}
        onCancel={() => setShowFinalizeConfirm(false)}
        onConfirm={handleFinalizeOrder}
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
        onDismiss={() => setShowDeletePrepaymentConfirm(false)}
        onCancel={() => setShowDeletePrepaymentConfirm(false)}
        onConfirm={handleDeletePrepayment}
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
      padding: responsive.spacing(theme.spacing.m, theme.spacing.s),
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
      paddingHorizontal: responsive.spacing(theme.spacing.m, theme.spacing.s),
      paddingVertical: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      paddingBottom: responsive.spacing(theme.spacing.m, theme.spacing.s),
    },
    scrollViewWithKeyboard: {
      maxHeight: responsive.isTablet ? 350 : 250,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      paddingVertical: responsive.spacing(theme.spacing.s, theme.spacing.xs),
      paddingHorizontal: responsive.spacing(theme.spacing.m, theme.spacing.s),
      marginHorizontal: responsive.spacing(theme.spacing.m, theme.spacing.s),
      marginTop: responsive.spacing(theme.spacing.s, theme.spacing.xs),
      marginBottom: responsive.spacing(theme.spacing.m, theme.spacing.s),
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
      marginHorizontal: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
    },
    loader: {
      marginVertical: responsive.spacing(theme.spacing.xl, theme.spacing.l),
    },
    paymentsSection: {
      paddingHorizontal: responsive.spacing(theme.spacing.m, theme.spacing.s),
      paddingBottom: responsive.spacing(theme.spacing.s, theme.spacing.xs),
    },
    sectionTitle: {
      ...theme.fonts.titleSmall,
      fontSize: responsive.fontSize(theme.fonts.titleSmall.fontSize),
      color: theme.colors.onSurface,
      marginBottom: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
      fontWeight: '600',
    },
    paymentItem: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      padding: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
      marginBottom: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      gap: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      paddingHorizontal: responsive.spacing(theme.spacing.m, theme.spacing.s),
      paddingBottom: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
    },
    methodsContainer: {
      marginBottom: responsive.spacing(theme.spacing.s, theme.spacing.xs),
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
      paddingHorizontal: responsive.spacing(theme.spacing.s, theme.spacing.xs),
      marginBottom: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      marginLeft: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      marginLeft: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      marginTop: responsive.spacing(theme.spacing.s, theme.spacing.xs),
    },
    amountRow: {
      flexDirection: 'row',
      gap: responsive.spacing(theme.spacing.xs, theme.spacing.xxs),
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
      paddingHorizontal: responsive.spacing(theme.spacing.s, theme.spacing.xs),
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
      gap: responsive.spacing(theme.spacing.m, theme.spacing.s),
      paddingHorizontal: responsive.spacing(theme.spacing.m, theme.spacing.s),
      paddingVertical: responsive.spacing(theme.spacing.m, theme.spacing.s),
      paddingTop: responsive.spacing(theme.spacing.s, theme.spacing.xs),
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
