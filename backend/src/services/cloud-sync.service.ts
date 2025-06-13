import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/domain/order';
import { CreateOrderDto } from '../orders/dto/create-order.dto';

@Injectable()
export class CloudSyncService {
  private readonly logger = new Logger(CloudSyncService.name);
  private readonly cloudApiUrl: string;
  private readonly syncApiKey: string;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {
    this.cloudApiUrl = this.configService.get('CLOUD_API_URL') || '';
    this.syncApiKey = this.configService.get('SYNC_API_KEY') || '';
  }

  @Cron('*/5 * * * *') // Cada 5 minutos
  async syncFromCloud() {
    if (!this.cloudApiUrl || !this.syncApiKey) {
      return;
    }

    try {
      // Obtener órdenes pendientes del cloud
      const response = await axios.get(
        `${this.cloudApiUrl}/api/sync/pending-orders`,
        {
          headers: {
            'X-API-Key': this.syncApiKey,
          },
        }
      );

      const cloudOrders = response.data;

      for (const cloudOrder of cloudOrders) {
        try {
          // Crear orden local
          const createOrderDto: CreateOrderDto = {
            orderType: cloudOrder.orderType,
            orderItems: cloudOrder.orderItems,
            orderDeliveryInfo: cloudOrder.orderDeliveryInfo,
            customerId: cloudOrder.customerId,
            scheduledDeliveryTime: cloudOrder.scheduledDeliveryTime,
          };

          // Aquí deberías usar tu servicio de órdenes existente
          // const localOrder = await this.ordersService.create(createOrderDto);

          // Marcar como sincronizada en el cloud
          await axios.put(
            `${this.cloudApiUrl}/api/orders/${cloudOrder.cloudId}/sync`,
            { localId: 123 }, // Usar el ID real de la orden local
            {
              headers: {
                'X-API-Key': this.syncApiKey,
              },
            }
          );

          this.logger.log(`Orden ${cloudOrder.cloudId} sincronizada exitosamente`);
        } catch (error) {
          this.logger.error(`Error sincronizando orden ${cloudOrder.cloudId}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error al sincronizar con el cloud:', error);
    }
  }
}