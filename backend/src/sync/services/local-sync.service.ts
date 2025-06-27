import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { io, Socket } from 'socket.io-client';
import { firstValueFrom } from 'rxjs';
import { SyncConfig } from '../config/sync-config.type';
import { SyncStatusService } from './sync-status.service';
import { SyncType } from '../domain/sync-log';
import { OrdersService } from '../../orders/orders.service';
import { CustomersService } from '../../customers/customers.service';
import { CategoriesService } from '../../categories/categories.service';
import { ProductsService } from '../../products/products.service';
import { RestaurantConfigService } from '../../restaurant-config/restaurant-config.service';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { OrderEntity } from '../../orders/infrastructure/persistence/relational/entities/order.entity';
import { OrderStatus } from '../../orders/domain/enums/order-status.enum';
import { OrderType } from '../../orders/domain/enums/order-type.enum';
import { CustomerEntity } from '../../customers/infrastructure/persistence/relational/entities/customer.entity';
import { OrderItemEntity } from '../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { DeliveryInfoEntity } from '../../orders/infrastructure/persistence/relational/entities/delivery-info.entity';
import { AddressEntity } from '../../customers/infrastructure/persistence/relational/entities/address.entity';

interface RemoteOrder {
  id: string;
  customer: any;
  orderItems: any[];
  deliveryInfo: any;
  [key: string]: any;
}

@Injectable()
export class LocalSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocalSyncService.name);
  private socket: Socket | null = null;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly syncConfig: SyncConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly syncStatusService: SyncStatusService,
    private readonly ordersService: OrdersService,
    private readonly customersService: CustomersService,
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
    private readonly restaurantConfigService: RestaurantConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    this.syncConfig = this.configService.get<SyncConfig>('sync', {
      infer: true,
    }) || {
      enabled: false,
      cloudApiUrl: '',
      cloudApiKey: '',
      intervalMinutes: 5,
      webSocketEnabled: false,
    };
  }

  async onModuleInit() {
    if (!this.syncConfig.enabled) {
      this.logger.warn('Sincronización deshabilitada por configuración');
      return;
    }

    await this.initialize();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  async initialize() {
    try {
      if (this.syncConfig.webSocketEnabled) {
        await this.connectWebSocket();
      }

      await this.runFullSync();
      const intervalMs = this.syncConfig.intervalMinutes * 60 * 1000;
      this.syncInterval = setInterval(async () => {
        await this.runFullSync();
      }, intervalMs) as unknown as NodeJS.Timeout;

      this.logger.log(
        `🔄 Sincronización iniciada. Intervalo: ${this.syncConfig.intervalMinutes} minutos`,
      );
    } catch (error) {
      this.logger.error('Error al inicializar sincronización:', error);
    }
  }

  private connectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    const wsUrl = `${this.syncConfig.cloudApiUrl}/sync`;
    this.logger.log(`🔌 Conectando a WebSocket: ${wsUrl}`);

    this.socket = io(wsUrl, {
      auth: { apiKey: this.syncConfig.cloudApiKey },
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionAttempts: 10,
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      this.logger.log('✅ Conectado al Backend en la Nube vía WebSocket');
    });

    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`❌ Desconectado del Backend en la Nube: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      this.logger.error('Error de conexión WebSocket:', error.message);
    });

    this.socket.on('order:new', async (data: { orderId: string }) => {
      this.logger.log(
        `🆕 Notificación de nueva orden recibida: ${data.orderId}`,
      );
      await this.pullPendingOrders();
    });
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async runFullSync(): Promise<void> {
    if (this.syncStatusService.isCurrentlySyncing()) {
      this.logger.warn('Sincronización ya en progreso, omitiendo ejecución');
      return;
    }

    const syncLog = await this.syncStatusService.startSync(SyncType.FULL);
    this.logger.log('⚙️  Iniciando sincronización completa...');

    let totalSynced = 0;
    let totalFailed = 0;
    const errors: Record<string, any> = {};

    try {
      // 1. PULL: Descargar órdenes pendientes desde remoto
      const ordersResult = await this.pullPendingOrders();
      totalSynced += ordersResult.synced;
      totalFailed += ordersResult.failed;
      if (ordersResult.error) errors.orders = ordersResult.error;

      // 2. PULL: Sincronizar clientes y direcciones desde remoto
      const customersResult = await this.pullCustomers();
      totalSynced += customersResult.synced;
      totalFailed += customersResult.failed;
      if (customersResult.error) errors.customers = customersResult.error;

      // 3. PUSH: Enviar menú y configuración al remoto
      const menuResult = await this.pushMenuAndConfig();
      totalSynced += menuResult.synced;
      totalFailed += menuResult.failed;
      if (menuResult.error) errors.menu = menuResult.error;

      // 4. PUSH: Enviar actualizaciones de clientes al remoto
      const customerUpdatesResult = await this.pushCustomerUpdates();
      totalSynced += customerUpdatesResult.synced;
      totalFailed += customerUpdatesResult.failed;
      if (customerUpdatesResult.error)
        errors.customerUpdates = customerUpdatesResult.error;

      await this.syncStatusService.completeSync(
        syncLog.id,
        totalSynced,
        totalFailed,
        Object.keys(errors).length > 0 ? errors : undefined,
      );

      this.logger.log(
        `✅ Sincronización completa. Sincronizados: ${totalSynced}, Fallidos: ${totalFailed}`,
      );
    } catch (error) {
      this.logger.error('❌ Error en sincronización completa:', error);
      await this.syncStatusService.failSync(syncLog.id, error);
    }
  }

  // PUSH: Enviar menú y configuración al backend remoto
  private async pushMenuAndConfig(): Promise<{
    synced: number;
    failed: number;
    error?: any;
  }> {
    try {
      const headers = { 'X-Sync-Api-Key': this.syncConfig.cloudApiKey };
      let synced = 0;
      let failed = 0;
      const errors: any[] = [];

      this.logger.log('📤 Enviando menú y configuración al backend remoto...');

      // 1. Obtener y enviar el menú completo
      try {
        // Obtener el menú completo con todas las relaciones
        const fullMenu = await this.categoriesService.getFullMenu();

        const menuPayload = { categories: fullMenu };

        await firstValueFrom(
          this.httpService.post(
            `${this.syncConfig.cloudApiUrl}/api/sync/menu`,
            menuPayload,
            { headers },
          ),
        );
        synced++;
        this.logger.log('✅ Menú enviado correctamente');
      } catch (error) {
        failed++;
        errors.push({ menu: error.message || error });
        this.logger.error('Error al enviar menú:', error);
      }

      // 2. Obtener y enviar la configuración del restaurante
      try {
        const config = await this.restaurantConfigService.getConfig();
        if (config) {
          const configPayload = { config };

          await firstValueFrom(
            this.httpService.post(
              `${this.syncConfig.cloudApiUrl}/api/sync/config`,
              configPayload,
              { headers },
            ),
          );
          synced++;
          this.logger.log('✅ Configuración enviada correctamente');
        }
      } catch (error) {
        failed++;
        errors.push({ config: error.message || error });
        this.logger.error('Error al enviar configuración:', error);
      }

      return {
        synced,
        failed,
        error: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('Error general al enviar menú y configuración:', error);
      return { synced: 0, failed: 2, error: error.message || error };
    }
  }

  // PULL: Descargar órdenes pendientes desde el backend remoto
  async pullPendingOrders(): Promise<{
    synced: number;
    failed: number;
    error?: any;
  }> {
    try {
      const headers = { 'X-Sync-Api-Key': this.syncConfig.cloudApiKey };

      // Descargar órdenes pendientes
      const response = await firstValueFrom(
        this.httpService.get<{ data: RemoteOrder[] }>(
          `${this.syncConfig.cloudApiUrl}/api/sync/orders/pending`,
          { headers },
        ),
      );

      const remoteOrders: RemoteOrder[] = response.data.data || [];
      if (remoteOrders.length === 0) {
        return { synced: 0, failed: 0 };
      }

      this.logger.log(
        `📦 Descargando ${remoteOrders.length} órdenes pendientes de WhatsApp...`,
      );

      const orderUpdates: { orderId: string; dailyNumber: number }[] = [];
      let synced = 0;
      let failed = 0;

      // Usar transacción para garantizar integridad
      await this.dataSource.transaction(async (manager) => {
        for (const remoteOrder of remoteOrders) {
          try {
            // Verificar si la orden ya existe
            const existingOrder = await manager.findOne('orders', {
              where: { id: remoteOrder.id },
            });

            if (!existingOrder) {
              // Asignar número de orden diario
              const dailyNumber = await this.getNextDailyNumber(manager);

              // Primero, guardar o actualizar el cliente si existe
              let customer: CustomerEntity | null = null;
              if (remoteOrder.customer) {
                // Buscar cliente existente por email o teléfono
                customer = await manager.findOne(CustomerEntity, {
                  where: [
                    { email: remoteOrder.customer.email },
                    {
                      whatsappPhoneNumber:
                        remoteOrder.customer.phoneNumber ||
                        remoteOrder.customer.whatsappPhoneNumber,
                    },
                  ],
                });

                if (!customer) {
                  // Crear nuevo cliente
                  customer = await manager.save(CustomerEntity, {
                    firstName: remoteOrder.customer.firstName,
                    lastName: remoteOrder.customer.lastName,
                    email: remoteOrder.customer.email,
                    whatsappPhoneNumber:
                      remoteOrder.customer.phoneNumber ||
                      remoteOrder.customer.whatsappPhoneNumber,
                  });
                }
              }

              // Crear la orden con estado PENDING y isFromWhatsApp = true
              const subtotal = remoteOrder.subtotal || 0;
              const order = await manager.save(OrderEntity, {
                id: remoteOrder.id,
                customer,
                dailyNumber,
                dailyOrderCounterId: remoteOrder.dailyOrderCounterId,
                isFromWhatsApp: true,
                orderStatus: OrderStatus.PENDING,
                orderType: remoteOrder.orderType || OrderType.DELIVERY,
                subtotal: subtotal,
                total: subtotal, // Por ahora total = subtotal
                notes: remoteOrder.notes,
                scheduledAt: remoteOrder.scheduledAt,
                estimatedDeliveryTime: remoteOrder.estimatedDeliveryTime,
              });

              // Guardar delivery info si existe
              if (remoteOrder.deliveryInfo) {
                // Crear o buscar dirección del cliente
                let address: AddressEntity | null = null;
                if (customer && remoteOrder.deliveryInfo.address) {
                  const addressData = remoteOrder.deliveryInfo.address;
                  address = await manager.save(AddressEntity, {
                    customer,
                    name: addressData.name || 'Dirección de entrega',
                    street: addressData.street || addressData.addressLine1,
                    number: addressData.number || 'S/N',
                    interiorNumber:
                      addressData.interiorNumber || addressData.addressLine2,
                    neighborhood: addressData.neighborhood,
                    city: addressData.city,
                    state: addressData.state,
                    zipCode: addressData.zipCode,
                    country: addressData.country || 'México',
                    latitude: addressData.latitude,
                    longitude: addressData.longitude,
                    deliveryInstructions: addressData.deliveryInstructions,
                    isDefault: false,
                  });
                }

                await manager.save(DeliveryInfoEntity, {
                  order,
                  recipientName: remoteOrder.deliveryInfo.recipientName,
                  recipientPhone: remoteOrder.deliveryInfo.recipientPhone,
                  deliveryInstructions:
                    remoteOrder.deliveryInfo.deliveryInstructions,
                  // Campos de dirección desde la dirección del cliente o los datos directos
                  fullAddress: remoteOrder.deliveryInfo.fullAddress,
                  street: address?.street || remoteOrder.deliveryInfo.street,
                  number: address?.number || remoteOrder.deliveryInfo.number,
                  interiorNumber:
                    address?.interiorNumber ||
                    remoteOrder.deliveryInfo.interiorNumber,
                  neighborhood:
                    address?.neighborhood ||
                    remoteOrder.deliveryInfo.neighborhood,
                  city: address?.city || remoteOrder.deliveryInfo.city,
                  state: address?.state || remoteOrder.deliveryInfo.state,
                  zipCode: address?.zipCode || remoteOrder.deliveryInfo.zipCode,
                  country: address?.country || remoteOrder.deliveryInfo.country,
                  latitude:
                    address?.latitude || remoteOrder.deliveryInfo.latitude,
                  longitude:
                    address?.longitude || remoteOrder.deliveryInfo.longitude,
                });
              }

              // Guardar order items
              if (remoteOrder.orderItems && remoteOrder.orderItems.length > 0) {
                for (const item of remoteOrder.orderItems) {
                  await manager.save(OrderItemEntity, {
                    order,
                    productId: item.product?.id,
                    productVariantId: item.productVariant?.id,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    notes: item.notes,
                    // Los modificadores se manejarían aquí si fuera necesario
                  });
                }
              }

              this.logger.log(
                `✅ Orden ${remoteOrder.id} guardada con número diario: ${dailyNumber}`,
              );
              orderUpdates.push({ orderId: remoteOrder.id, dailyNumber });
              synced++;
            } else {
              this.logger.log(
                `⚠️ Orden ${remoteOrder.id} ya existe localmente`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error al procesar orden ${remoteOrder.id}:`,
              error,
            );
            failed++;
          }
        }
      });

      // Confirmar órdenes sincronizadas al backend remoto
      if (orderUpdates.length > 0) {
        await firstValueFrom(
          this.httpService.post(
            `${this.syncConfig.cloudApiUrl}/api/sync/orders/confirm`,
            { orderUpdates },
            { headers },
          ),
        );
        this.logger.log(
          `✅ ${orderUpdates.length} órdenes confirmadas en el backend remoto`,
        );
      }

      return { synced, failed };
    } catch (error) {
      this.logger.error('Error al sincronizar órdenes pendientes:', error);
      return { synced: 0, failed: 1, error: error.message || error };
    }
  }

  // PULL: Sincronizar clientes y direcciones desde el backend remoto
  private async pullCustomers(): Promise<{
    synced: number;
    failed: number;
    error?: any;
  }> {
    try {
      const headers = { 'X-Sync-Api-Key': this.syncConfig.cloudApiKey };

      // Obtener fecha de última sincronización de clientes
      const lastCustomerSync = await this.syncStatusService[
        'syncLogRepository'
      ].findLatestByType(SyncType.CUSTOMERS);
      const since =
        lastCustomerSync?.completedAt?.toISOString() ||
        new Date(0).toISOString();

      const response = await firstValueFrom(
        this.httpService.get<{ data: any[] }>(
          `${this.syncConfig.cloudApiUrl}/api/sync/customers/changes?since=${since}`,
          { headers },
        ),
      );

      const remoteCustomers = response.data.data || [];
      this.logger.log(
        `📥 Sincronizando ${remoteCustomers.length} clientes desde el backend remoto...`,
      );

      // TODO: Implementar lógica de guardado/actualización de clientes
      // Considerar conflictos si el cliente fue modificado localmente

      return { synced: remoteCustomers.length, failed: 0 };
    } catch (error) {
      this.logger.error('Error al sincronizar clientes:', error);
      return { synced: 0, failed: 1, error: error.message || error };
    }
  }

  // PUSH: Enviar actualizaciones de clientes al backend remoto
  private async pushCustomerUpdates(): Promise<{
    synced: number;
    failed: number;
    error?: any;
  }> {
    try {
      const headers = { 'X-Sync-Api-Key': this.syncConfig.cloudApiKey };

      // TODO: Obtener clientes modificados localmente desde la última sincronización
      // Filtrar por lastSyncedAt < updatedAt

      const modifiedCustomers = [];

      if (modifiedCustomers.length === 0) {
        return { synced: 0, failed: 0 };
      }

      this.logger.log(
        `📤 Enviando ${modifiedCustomers.length} actualizaciones de clientes...`,
      );

      await firstValueFrom(
        this.httpService.post(
          `${this.syncConfig.cloudApiUrl}/api/sync/customers/bulk`,
          { customers: modifiedCustomers },
          { headers },
        ),
      );

      // TODO: Actualizar lastSyncedAt de los clientes enviados

      return { synced: modifiedCustomers.length, failed: 0 };
    } catch (error) {
      this.logger.error('Error al enviar actualizaciones de clientes:', error);
      return { synced: 0, failed: 1, error: error.message || error };
    }
  }

  private async getNextDailyNumber(manager?: any): Promise<number> {
    // TODO: Implementar lógica real para obtener el siguiente número de orden diario
    // Esto debería consultar la tabla daily_order_counter
    const today = new Date().toISOString().split('T')[0];

    // Si se proporciona un manager de transacción, usarlo
    const queryRunner = manager || this.dataSource;

    // Buscar o crear el contador del día
    let counter = await queryRunner.findOne('daily_order_counter', {
      where: { date: today },
    });

    if (!counter) {
      counter = await queryRunner.save('daily_order_counter', {
        date: today,
        current_number: 1,
      });
      return 1;
    }

    // Incrementar y retornar
    const nextNumber = counter.current_number + 1;
    await queryRunner.update(
      'daily_order_counter',
      { id: counter.id },
      { current_number: nextNumber },
    );

    return nextNumber;
  }

  // Método para aceptar órdenes de WhatsApp (cambiar de PENDING a IN_PROGRESS)
  async acceptWhatsAppOrders(orderIds: string[]): Promise<{
    accepted: number;
    failed: number;
  }> {
    let accepted = 0;
    let failed = 0;

    // Usar transacción para garantizar integridad
    await this.dataSource.transaction(async (manager) => {
      for (const orderId of orderIds) {
        try {
          // Buscar la orden
          const order = await manager.findOne(OrderEntity, {
            where: { id: orderId, isFromWhatsApp: true },
          });

          if (!order) {
            this.logger.warn(
              `Orden ${orderId} no encontrada o no es de WhatsApp`,
            );
            failed++;
            continue;
          }

          if (order.orderStatus !== OrderStatus.PENDING) {
            this.logger.warn(`Orden ${orderId} no está en estado PENDING`);
            failed++;
            continue;
          }

          // Actualizar el estado de la orden
          await manager.update(
            OrderEntity,
            { id: orderId },
            {
              orderStatus: OrderStatus.IN_PROGRESS,
            },
          );

          this.logger.log(`✅ Orden ${orderId} aceptada`);
          accepted++;
        } catch (error) {
          this.logger.error(`Error al aceptar orden ${orderId}:`, error);
          failed++;
        }
      }
    });

    return { accepted, failed };
  }

  // Método público para forzar sincronización desde el controlador
  async triggerSync(): Promise<void> {
    await this.runFullSync();
  }
}
