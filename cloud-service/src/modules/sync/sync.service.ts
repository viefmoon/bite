import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class SyncService {
  constructor(private readonly ordersService: OrdersService) {}

  async getPendingOrders() {
    const orders = await this.ordersService.getUnsyncedOrders();
    
    // Transformar las órdenes al formato esperado por el backend local
    return orders.map(order => ({
      cloudId: order.id,
      orderType: order.orderType,
      status: order.status,
      totalCost: order.totalCost,
      customerId: order.customerPhone,
      estimatedTime: order.estimatedTime,
      scheduledDeliveryTime: order.scheduledDeliveryTime,
      orderDeliveryInfo: order.orderType === 'delivery' ? {
        streetAddress: order.deliveryAddress,
        additionalDetails: order.deliveryAdditionalDetails,
        latitude: order.deliveryLatitude,
        longitude: order.deliveryLongitude,
      } : {
        pickupName: order.pickupName,
      },
      orderItems: order.items.map(item => ({
        productId: item.productId,
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        comments: item.comments,
        selectedPizzaIngredients: item.selectedPizzaIngredients || [],
        selectedModifiers: item.selectedModifiers || [],
      })),
      createdAt: order.createdAt,
    }));
  }
}