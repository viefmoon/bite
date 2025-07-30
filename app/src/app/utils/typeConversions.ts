/**
 * Mapea Order a OrderOpenList agregando propiedades calculadas
 * Nota: El backend ahora envía todos los campos numéricos como números
 */
export const mapOrderToOrderOpenList = (order: any): any => {
  const totalPaid =
    order.payments?.reduce(
      (sum: number, payment: any) => sum + (payment.amount || 0),
      0,
    ) || 0;

  // Mapear preparationScreenStatuses al formato esperado
  const preparationScreenStatuses = order.preparationScreenStatuses?.map(
    (status: any) => ({
      name: status.preparationScreenName || status.name,
      status: status.status,
    }),
  );

  return {
    ...order,
    orderNumber: order.id, // Usar ID como orderNumber si no existe
    shiftOrderNumber: order.shiftOrderNumber || 0,
    totalAmount: order.total || order.totalAmount || 0,
    tableNumber: order.table?.isTemporary ? null : order.table?.name || 0,
    customerName:
      order.customer?.firstName && order.customer?.lastName
        ? `${order.customer.firstName} ${order.customer.lastName}`
        : order.deliveryInfo?.recipientName || null,
    itemCount: order.orderItems?.length || 0,
    paymentsSummary: {
      totalPaid,
    },
    preparationScreenStatuses,
  };
};
