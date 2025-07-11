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
import {
  PaymentMethodEnum,
  PaymentStatusEnum,
  type PaymentMethod,
} from '../types/payment.types';
import {
  useGetPaymentsByOrderIdQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,
} from '../hooks/usePaymentQueries';
import { useCompleteOrderMutation } from '../hooks/useOrdersQueries';
import ConfirmationModal from '@/app/components/common/ConfirmationModal';
import ChangeCalculatorModal from './ChangeCalculatorModal';
import { prepaymentService } from '@/modules/payments/services/prepaymentService';

interface PaymentModalProps {
  visible: boolean;
  onDismiss: () => void;
  orderId?: string; // Opcional para modo pre-pago
  orderTotal: number;
  orderNumber?: number;
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

const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH: '💵 Efectivo',
  CARD: '💳 Tarjeta',
  TRANSFER: '📱 Transferencia',
};

const _paymentMethodIcons: Record<PaymentMethod, string> = {
  CASH: 'cash',
  CARD: 'credit-card',
  TRANSFER: 'bank-transfer',
};

// Métodos de pago deshabilitados temporalmente
const _disabledMethods: PaymentMethod[] = ['CARD', 'TRANSFER'];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  visible,
  onDismiss,
  orderId,
  orderTotal,
  orderNumber,
  onOrderCompleted,
  mode = 'payment',
  onPrepaymentCreated,
  existingPrepaymentId,
  onPrepaymentDeleted,
}) => {
  const theme = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
  // const updatePaymentMutation = useUpdatePaymentMutation(); // No se usa actualmente
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
      console.error('Error processing payment:', error);
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
      console.error('Error eliminando pre-pago:', error);
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
                        style={[styles.summaryAmount, { color: '#4CAF50' }]}
                      >
                        ${totalPaid.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.summaryDividerVertical} />
                    <View style={styles.summaryItem}>
                      <Text
                        style={[styles.summaryLabel, { fontWeight: 'bold' }]}
                      >
                        Pendiente
                      </Text>
                      <Text
                        style={[
                          styles.summaryAmount,
                          {
                            fontWeight: 'bold',
                            color:
                              pendingAmount > 0
                                ? theme.colors.error
                                : '#4CAF50',
                          },
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
                                {paymentMethodLabels[payment.paymentMethod]}
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
                      const isDisabled = _disabledMethods.includes(
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
                              {paymentMethodLabels[value]}
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
                  style={[
                    styles.footerButton,
                    { borderColor: theme.colors.error },
                  ]}
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
                  style={[styles.footerButton, { backgroundColor: '#10B981' }]}
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
        message={`¿Está seguro de que desea finalizar la orden #${orderNumber}? La orden se marcará como completada.`}
        confirmText="Sí, finalizar"
        cancelText="No, cancelar"
        confirmButtonColor="#10B981"
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

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
    },
    modalWrapper: {
      width: '100%',
      maxWidth: 600,
      maxHeight: '85%',
    },
    modalContent: {
      borderRadius: theme.roundness * 2,
      backgroundColor: theme.colors.surface,
      width: '100%',
      maxHeight: '100%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
    },
    headerTextContainer: {
      flex: 1,
    },
    title: {
      ...theme.fonts.headlineSmall,
      color: theme.colors.onSurface,
      fontWeight: 'bold',
    },
    orderNumber: {
      ...theme.fonts.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
    scrollView: {
      maxHeight: 500,
    },
    scrollViewContent: {
      paddingBottom: theme.spacing.m,
    },
    scrollViewWithKeyboard: {
      maxHeight: 250,
    },
    summaryContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      marginHorizontal: theme.spacing.m,
      marginTop: theme.spacing.s,
      marginBottom: theme.spacing.m,
      borderRadius: theme.roundness,
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onPrimaryContainer,
      opacity: 0.8,
      marginBottom: 2,
    },
    summaryAmount: {
      ...theme.fonts.titleSmall,
      fontWeight: 'bold',
      color: theme.colors.onPrimaryContainer,
    },
    summaryDividerVertical: {
      width: 1,
      height: '80%',
      backgroundColor: theme.colors.onPrimaryContainer,
      opacity: 0.2,
      marginHorizontal: theme.spacing.xs,
    },
    loader: {
      marginVertical: theme.spacing.xl,
    },
    paymentsSection: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    sectionTitle: {
      ...theme.fonts.titleSmall,
      color: theme.colors.onSurface,
      marginBottom: theme.spacing.xs,
      fontWeight: '600',
    },
    paymentItem: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: theme.roundness,
      padding: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
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
      gap: theme.spacing.xs,
    },
    paymentMethodRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    paymentMethodCompact: {
      ...theme.fonts.bodyMedium,
      fontWeight: '500',
      color: theme.colors.onSurface,
    },
    paymentAmountCompact: {
      ...theme.fonts.bodyMedium,
      fontWeight: 'bold',
      color: theme.colors.primary,
      minWidth: 70,
      textAlign: 'right',
    },
    paymentDateCompact: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },
    statusChipCompact: {
      height: 22,
      minWidth: 80,
    },
    statusChipTextCompact: {
      fontSize: 10,
      fontWeight: '600',
      color: 'white',
      lineHeight: 12,
    },
    deleteIconButton: {
      margin: 0,
      width: 36,
      height: 36,
    },
    formSection: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.xs,
    },
    methodsContainer: {
      marginBottom: theme.spacing.s,
    },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
      marginBottom: theme.spacing.xs,
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
      color: theme.colors.onSurface,
      marginLeft: theme.spacing.xs,
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
      marginLeft: theme.spacing.xs,
    },
    methodTextDisabled: {
      color: theme.colors.onSurfaceDisabled,
    },
    comingSoonText: {
      ...theme.fonts.bodySmall,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 2,
    },
    amountContainer: {
      marginTop: theme.spacing.s,
    },
    amountRow: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      alignItems: 'flex-start',
    },
    amountInput: {
      backgroundColor: theme.colors.surface,
      flex: 1,
    },
    totalPendingButton: {
      marginTop: 4, // Alinear con el input que tiene un label
      height: 56, // Misma altura que el TextInput con outlined
      borderColor: theme.colors.primary,
      justifyContent: 'center',
    },
    totalPendingButtonContent: {
      height: '100%',
      paddingVertical: 0,
      paddingHorizontal: theme.spacing.s,
    },
    totalPendingButtonLabel: {
      fontSize: 13,
      lineHeight: 20,
      textAlignVertical: 'center',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
      paddingTop: theme.spacing.s,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    footerButton: {
      minWidth: 120,
    },
    footerButtonContent: {
      height: 40,
    },
    cancelButton: {
      borderColor: theme.colors.outline,
    },
  });

export default PaymentModal;
