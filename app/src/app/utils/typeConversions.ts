export const mapOrderToOrderOpenList = (order: any): any => {
  const totalPaid =
    order.payments?.reduce(
      (sum: number, payment: any) => sum + (payment.amount || 0),
      0,
    ) || 0;

  const preparationScreenStatuses = order.preparationScreenStatuses;

  return {
    ...order,
    orderNumber: order.id,
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
