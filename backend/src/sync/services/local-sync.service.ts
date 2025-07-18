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
import { CategoriesService } from '../../categories/categories.service';
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
import { PullChangesResponseDto } from '../dto/pull-changes-response.dto';
import { Order } from '../../orders/domain/order';
import { Customer } from '../../customers/domain/customer';
import { PreparationStatus } from '../../orders/domain/order-item';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { UpdateOrderStatusResponseDto } from '../dto/update-order-status-response.dto';
import { RestaurantDataResponseDto } from '../dto/restaurant-data-response.dto';
import { SyncActivityEntity, SyncActivityType } from '../infrastructure/persistence/relational/entities/sync-activity.entity';
import { PullChangesRequestDto } from '../dto/pull-changes-request.dto';

@Injectable()
export class LocalSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocalSyncService.name);
  private socket: Socket | null = null;
  private readonly syncConfig: SyncConfig;
  private isWebSocketConnected = false;
  private webSocketFailed = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly categoriesService: CategoriesService,
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

    // Solo inicializar WebSocket para notificaciones en tiempo real
    if (this.syncConfig.webSocketEnabled) {
      await this.connectWebSocket();
    }

    this.logger.log('🔄 Servicio de sincronización iniciado (modo pull)');
  }

  onModuleDestroy() {
    this.disconnect();
  }


  private connectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    const wsUrl = `${this.syncConfig.cloudApiUrl}`;
    this.logger.log(`🔌 Intentando conectar a WebSocket: ${wsUrl}`);

    this.socket = io(wsUrl, {
      auth: { apiKey: this.syncConfig.cloudApiKey },
      reconnection: true,
      reconnectionDelay: 5000, // 5 segundos inicial
      reconnectionDelayMax: 30000, // Máximo 30 segundos entre intentos
      reconnectionAttempts: Infinity, // Intentar indefinidamente
      transports: ['polling', 'websocket'], // Permitir polling primero, luego upgrade a websocket
      timeout: 20000, // Timeout de conexión inicial de 20 segundos
      path: '/socket.io/', // Path explícito para socket.io
    });


    this.socket.on('disconnect', (reason) => {
      this.logger.warn(`❌ Desconectado del Backend en la Nube: ${reason}`);
      this.isWebSocketConnected = false;
    });

    let errorCount = 0;
    let lastErrorLog = 0;
    this.socket.on('connect_error', (error) => {
      errorCount++;
      this.isWebSocketConnected = false;
      
      const now = Date.now();
      // Mostrar log solo cada 30 segundos para reducir spam
      if (now - lastErrorLog > 30000) {
        lastErrorLog = now;
        this.logger.warn(
          `WebSocket: Aún intentando conectar (${errorCount} intentos). ` +
          `Servidor: ${this.syncConfig.cloudApiUrl}`
        );
      }
    });
    
    // Eventos de reconexión
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      if (attemptNumber === 1) {
        this.logger.log('🔄 WebSocket: Intentando reconectar...');
      }
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      this.logger.log(`✅ WebSocket: Reconectado después de ${attemptNumber} intentos`);
    });
    
    // Socket.io maneja el heartbeat automáticamente
    // El servidor debe estar configurado con pingInterval y pingTimeout

    // Con reconnectionAttempts: Infinity, este evento no se disparará
    // pero lo dejamos por si cambia la configuración
    this.socket.on('reconnect_failed', () => {
      this.webSocketFailed = true;
      this.isWebSocketConnected = false;
      this.logger.error(
        'WebSocket: Conexión fallida definitivamente.'
      );
    });
    
    // Resetear el estado de fallo si se logra conectar
    this.socket.on('connect', () => {
      this.logger.log('✅ Conectado al Backend en la Nube vía WebSocket');
      this.isWebSocketConnected = true;
      this.webSocketFailed = false;
      errorCount = 0; // Resetear contador de errores
    });

    // Evento genérico para cualquier cambio pendiente en la nube
    this.socket.on('changes:pending', async () => {
      this.logger.log(
        `🔔 Notificación de cambios pendientes recibida`,
      );
      // Ejecutar pull de cambios
      // Esto obtendrá todos los cambios pendientes (órdenes, clientes, etc.)
      await this.pullChanges();
    });
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }


  // Nuevo método unificado para pull de cambios
  async pullChanges(confirmDto?: PullChangesRequestDto): Promise<PullChangesResponseDto> {
    try {
      const headers = { 'X-Sync-Api-Key': this.syncConfig.cloudApiKey };
      
      const url = `${this.syncConfig.cloudApiUrl}/api/sync/pull-changes`;

      // Hacer la petición al backend en la nube, incluyendo confirmaciones si existen
      const response = await firstValueFrom(
        this.httpService.post<PullChangesResponseDto>(url, confirmDto || {}, { headers }),
      );

      const pullData = response.data;
      
      // Registrar actividad de sincronización exitosa
      await this.logSyncActivity(SyncActivityType.PULL_CHANGES, 'IN', true);

      this.logger.log(
        `📥 Recibidos: ${pullData.pending_orders?.length || 0} pedidos, ${
          pullData.updated_customers?.length || 0
        } clientes actualizados`,
      );

      // Si no hay cambios pendientes, retornar inmediatamente
      if (
        (!pullData.pending_orders || pullData.pending_orders.length === 0) &&
        (!pullData.updated_customers || pullData.updated_customers.length === 0)
      ) {
        return pullData;
      }

      // Procesar los cambios en una transacción
      await this.dataSource.transaction(async (manager) => {
        // 1. Procesar pedidos pendientes
        if (pullData.pending_orders && pullData.pending_orders.length > 0) {
          for (const remoteOrder of pullData.pending_orders) {
            try {
              await this.processRemoteOrder(manager, remoteOrder);
            } catch (error) {
              this.logger.error(
                `Error procesando pedido ${remoteOrder.id}:`,
                error,
              );
            }
          }
        }

        // 2. Procesar clientes actualizados
        if (pullData.updated_customers && pullData.updated_customers.length > 0) {
          for (const remoteCustomer of pullData.updated_customers) {
            try {
              await this.processRemoteCustomer(manager, remoteCustomer);
            } catch (error) {
              this.logger.error(
                `Error procesando cliente ${remoteCustomer.id}:`,
                error,
              );
            }
          }
        }
      });

      this.logger.log('✅ Cambios procesados correctamente');
      return pullData;
    } catch (error) {
      this.logger.error('Error en pullChanges:', error);
      // Registrar actividad de sincronización fallida
      await this.logSyncActivity(SyncActivityType.PULL_CHANGES, 'IN', false);
      throw error;
    }
  }

  // Método auxiliar para procesar un pedido remoto
  private async processRemoteOrder(
    manager: any,
    remoteOrder: Order,
  ): Promise<void> {
    // Verificar si la orden ya existe
    const existingOrder = await manager.findOne(OrderEntity, {
      where: { id: remoteOrder.id },
    });

    if (existingOrder) {
      this.logger.log(`⚠️ Orden ${remoteOrder.id} ya existe localmente`);
      return;
    }

    // Obtener el número de orden del turno
    const shiftOrderNumber = await this.getNextShiftOrderNumber(manager, remoteOrder.shiftId || await this.getCurrentShiftId(manager));

    // Procesar cliente si existe
    let customer: CustomerEntity | null = null;
    if (remoteOrder.customer) {
      customer = await this.findOrCreateCustomer(
        manager,
        remoteOrder.customer,
      );
    }

    // Crear la orden con todos los campos relevantes
    const order = await manager.save(OrderEntity, {
      id: remoteOrder.id,
      customer,
      customerId: customer?.id || remoteOrder.customerId || null,
      shiftOrderNumber,
      shiftId: remoteOrder.shiftId || await this.getCurrentShiftId(manager),
      userId: remoteOrder.userId || remoteOrder.user?.id || null,
      tableId: remoteOrder.tableId || remoteOrder.table?.id || null,
      isFromWhatsApp: true,
      orderStatus: remoteOrder.orderStatus || OrderStatus.PENDING,
      orderType: remoteOrder.orderType || OrderType.DELIVERY,
      subtotal: remoteOrder.subtotal || 0,
      total: remoteOrder.total || remoteOrder.subtotal || 0,
      notes: remoteOrder.notes || null,
      scheduledAt: remoteOrder.scheduledAt || null,
      estimatedDeliveryTime: remoteOrder.estimatedDeliveryTime || null,
      finalizedAt: remoteOrder.finalizedAt || null,
    });

    // Guardar delivery info si existe
    if (remoteOrder.deliveryInfo) {
      await this.saveDeliveryInfo(manager, order, remoteOrder.deliveryInfo, customer);
    }

    // Guardar order items con todas sus relaciones
    if (remoteOrder.orderItems && remoteOrder.orderItems.length > 0) {
      for (const item of remoteOrder.orderItems) {
        const orderItem = await manager.save(OrderItemEntity, {
          order,
          productId: item.productId || item.product?.id,
          productVariantId: item.productVariantId || item.productVariant?.id,
          basePrice: item.basePrice || 0,
          finalPrice: item.finalPrice || 0,
          preparationStatus: item.preparationStatus || PreparationStatus.PENDING,
          statusChangedAt: new Date(),
          preparationNotes: item.preparationNotes || null,
          preparedAt: item.preparedAt || null,
          preparedById: item.preparedById || item.preparedBy?.id || null,
        });

        // Guardar product modifiers si existen
        if (item.productModifiers && item.productModifiers.length > 0) {
          const modifierIds = item.productModifiers.map(
            (mod) => mod.id || mod
          ).filter(Boolean);
          
          if (modifierIds.length > 0) {
            await manager
              .createQueryBuilder()
              .insert()
              .into('order_item_product_modifiers')
              .values(
                modifierIds.map((modifierId) => ({
                  order_item_id: orderItem.id,
                  product_modifier_id: modifierId,
                }))
              )
              .execute();
          }
        }

        // Guardar pizza customizations si existen
        if (item.selectedPizzaCustomizations && item.selectedPizzaCustomizations.length > 0) {
          for (const customization of item.selectedPizzaCustomizations) {
            await manager.save('selected_pizza_customization', {
              orderItemId: orderItem.id,
              pizzaCustomizationId: customization.pizzaCustomizationId || customization.pizzaCustomization?.id,
              half: customization.half,
              action: customization.action,
            });
          }
        }

        // Guardar adjustments si existen
        if (item.adjustments && item.adjustments.length > 0) {
          for (const adjustment of item.adjustments) {
            await manager.save('adjustment', {
              orderItemId: orderItem.id,
              name: adjustment.name,
              isPercentage: adjustment.isPercentage,
              value: adjustment.value,
              amount: adjustment.amount,
              appliedById: adjustment.appliedById || adjustment.appliedBy?.id,
              appliedAt: adjustment.appliedAt || new Date(),
            });
          }
        }
      }
    }

    this.logger.log(
      `✅ Orden ${remoteOrder.id} guardada con número de turno: ${shiftOrderNumber}`,
    );
  }

  // Método auxiliar para procesar un cliente remoto
  private async processRemoteCustomer(
    manager: any,
    remoteCustomer: Customer,
  ): Promise<void> {
    // Buscar cliente existente
    const existingCustomer = await manager.findOne(CustomerEntity, {
      where: { id: remoteCustomer.id },
    });

    if (existingCustomer) {
      // Actualizar cliente existente
      await manager.update(CustomerEntity, { id: remoteCustomer.id }, {
        firstName: remoteCustomer.firstName,
        lastName: remoteCustomer.lastName,
        email: remoteCustomer.email,
        whatsappPhoneNumber: remoteCustomer.whatsappPhoneNumber,
      });
      this.logger.log(`✅ Cliente ${remoteCustomer.id} actualizado`);
    } else {
      // Crear nuevo cliente
      await manager.save(CustomerEntity, {
        id: remoteCustomer.id,
        firstName: remoteCustomer.firstName,
        lastName: remoteCustomer.lastName,
        email: remoteCustomer.email,
        whatsappPhoneNumber: remoteCustomer.whatsappPhoneNumber,
      });
      this.logger.log(`✅ Cliente ${remoteCustomer.id} creado`);
    }

    // Procesar direcciones del cliente si existen
    if (remoteCustomer.addresses && remoteCustomer.addresses.length > 0) {
      for (const address of remoteCustomer.addresses) {
        const existingAddress = await manager.findOne(AddressEntity, {
          where: { id: address.id },
        });

        if (!existingAddress) {
          await manager.save(AddressEntity, {
            id: address.id,
            customer: { id: remoteCustomer.id },
            name: address.name,
            street: address.street,
            number: address.number,
            interiorNumber: address.interiorNumber,
            neighborhood: address.neighborhood,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            country: address.country,
            latitude: address.latitude,
            longitude: address.longitude,
            deliveryInstructions: address.deliveryInstructions,
            isDefault: address.isDefault,
          });
        }
      }
    }
  }

  // Método auxiliar para encontrar o crear un cliente
  private async findOrCreateCustomer(
    manager: any,
    customerData: any,
  ): Promise<CustomerEntity> {
    // Buscar cliente existente por email o teléfono
    let customer = await manager.findOne(CustomerEntity, {
      where: [
        { email: customerData.email },
        {
          whatsappPhoneNumber:
            customerData.phoneNumber || customerData.whatsappPhoneNumber,
        },
      ],
    });

    if (!customer) {
      // Crear nuevo cliente
      customer = await manager.save(CustomerEntity, {
        id: customerData.id,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        whatsappPhoneNumber:
          customerData.phoneNumber || customerData.whatsappPhoneNumber,
      });
    }

    return customer;
  }

  // Método auxiliar para guardar delivery info
  private async saveDeliveryInfo(
    manager: any,
    order: OrderEntity,
    deliveryInfo: any,
    customer: CustomerEntity | null,
  ): Promise<void> {
    // Crear o buscar dirección del cliente
    let address: AddressEntity | null = null;
    if (customer && deliveryInfo.address) {
      const addressData = deliveryInfo.address;
      address = await manager.save(AddressEntity, {
        customer,
        name: addressData.name || 'Dirección de entrega',
        street: addressData.street || addressData.addressLine1,
        number: addressData.number || 'S/N',
        interiorNumber: addressData.interiorNumber || addressData.addressLine2,
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
      recipientName: deliveryInfo.recipientName,
      recipientPhone: deliveryInfo.recipientPhone,
      deliveryInstructions: deliveryInfo.deliveryInstructions,
      fullAddress: deliveryInfo.fullAddress,
      street: address?.street || deliveryInfo.street,
      number: address?.number || deliveryInfo.number,
      interiorNumber: address?.interiorNumber || deliveryInfo.interiorNumber,
      neighborhood: address?.neighborhood || deliveryInfo.neighborhood,
      city: address?.city || deliveryInfo.city,
      state: address?.state || deliveryInfo.state,
      zipCode: address?.zipCode || deliveryInfo.zipCode,
      country: address?.country || deliveryInfo.country,
      latitude: address?.latitude || deliveryInfo.latitude,
      longitude: address?.longitude || deliveryInfo.longitude,
    });
  }

  // Método para notificar cambios de estado de orden a la nube
  async updateOrderStatus(
    updateDto: UpdateOrderStatusDto,
  ): Promise<UpdateOrderStatusResponseDto> {
    try {
      const headers = { 'X-Sync-Api-Key': this.syncConfig.cloudApiKey };
      
      this.logger.log(
        `📤 Notificando cambio de estado: Orden ${updateDto.orderId} -> ${updateDto.newStatus}`,
      );

      // Hacer la petición al backend en la nube
      const response = await firstValueFrom(
        this.httpService.post<UpdateOrderStatusResponseDto>(
          `${this.syncConfig.cloudApiUrl}/api/sync/order-status`,
          updateDto,
          { headers },
        ),
      );

      const result = response.data;
      
      this.logger.log(
        `✅ Estado actualizado en la nube. Cliente notificado: ${result.customerNotified}`,
      );

      // Registrar actividad exitosa
      await this.logSyncActivity(SyncActivityType.ORDER_STATUS, 'OUT', true);
      
      return result;
    } catch (error) {
      this.logger.error('Error al actualizar estado en la nube:', error);
      
      // Registrar actividad fallida
      await this.logSyncActivity(SyncActivityType.ORDER_STATUS, 'OUT', false);
      
      // Si falla la sincronización, devolver una respuesta indicando el fallo
      // pero no lanzar error para no interrumpir el flujo local
      return {
        success: false,
        message: `Error al sincronizar con la nube: ${error.message}`,
        updatedAt: new Date().toISOString(),
        customerNotified: false,
      };
    }
  }

  // Método auxiliar para obtener el siguiente número de orden del turno
  private async getNextShiftOrderNumber(manager: any, shiftId: string): Promise<number> {
    const lastOrder = await manager.findOne(OrderEntity, {
      where: { shiftId },
      order: { shiftOrderNumber: 'DESC' },
      select: ['shiftOrderNumber'],
    });

    return lastOrder ? lastOrder.shiftOrderNumber + 1 : 1;
  }

  // Método auxiliar para obtener el shift actual
  private async getCurrentShiftId(manager: any): Promise<string> {
    // Buscar el shift activo actual
    const activeShift = await manager.findOne('shift', {
      where: { isActive: true },
      order: { startedAt: 'DESC' },
    });

    if (activeShift) {
      return activeShift.id;
    }

    // Si no hay shift activo, crear uno temporal
    const newShift = await manager.save('shift', {
      isActive: true,
      startedAt: new Date(),
      openingCash: 0,
    });

    return newShift.id;
  }

  // Método para que el backend remoto obtenga los datos del restaurante
  async getRestaurantData(ifModifiedSince?: Date): Promise<RestaurantDataResponseDto | null> {
    try {
      // Obtener el menú completo
      const categories = await this.categoriesService.getFullMenu();
      
      // Obtener la configuración del restaurante
      const config = await this.restaurantConfigService.getConfig();
      
      // Calcular la última actualización del menú
      let menuLastUpdated = new Date(0);
      for (const category of categories) {
        if (category.updatedAt && category.updatedAt > menuLastUpdated) {
          menuLastUpdated = category.updatedAt;
        }
        // Revisar también las subcategorías
        if (category.subcategories) {
          for (const subcategory of category.subcategories) {
            if (subcategory.updatedAt && subcategory.updatedAt > menuLastUpdated) {
              menuLastUpdated = subcategory.updatedAt;
            }
            // Revisar productos dentro de subcategorías
            if (subcategory.products) {
              for (const product of subcategory.products) {
                if (product.updatedAt && product.updatedAt > menuLastUpdated) {
                  menuLastUpdated = product.updatedAt;
                }
              }
            }
          }
        }
      }
      
      // Última actualización de la configuración
      const configLastUpdated = config?.updatedAt || new Date();
      
      // Si se especificó ifModifiedSince, verificar si hay cambios
      if (ifModifiedSince) {
        const lastModified = menuLastUpdated > configLastUpdated ? menuLastUpdated : configLastUpdated;
        if (lastModified <= ifModifiedSince) {
          // No hay cambios desde la fecha especificada
          return null;
        }
      }
      
      // Construir la respuesta
      const response: RestaurantDataResponseDto = {
        menu: {
          categories,
          lastUpdated: menuLastUpdated,
        },
        config: {
          restaurantConfig: config,
          businessHours: config?.businessHours || [],
          lastUpdated: configLastUpdated,
        },
        timestamp: new Date(),
      };
      
      this.logger.log(
        `📤 Datos del restaurante preparados para sincronización (${categories.length} categorías)`,
      );
      
      // Registrar actividad de sincronización
      await this.logSyncActivity(SyncActivityType.RESTAURANT_DATA, 'OUT', true);
      
      return response;
    } catch (error) {
      this.logger.error('Error al obtener datos del restaurante:', error);
      await this.logSyncActivity(SyncActivityType.RESTAURANT_DATA, 'OUT', false);
      throw error;
    }
  }

  // Método auxiliar para registrar actividad de sincronización
  private async logSyncActivity(
    type: SyncActivityType,
    direction: 'IN' | 'OUT',
    success: boolean,
  ): Promise<void> {
    try {
      await this.dataSource.manager.save(SyncActivityEntity, {
        type,
        direction,
        success,
      });
    } catch (error) {
      // No fallar si no se puede registrar la actividad
      this.logger.warn('No se pudo registrar actividad de sincronización:', error);
    }
  }

  // Método para obtener actividad reciente
  async getRecentActivity(limit: number = 20): Promise<SyncActivityEntity[]> {
    return await this.dataSource.manager.find(SyncActivityEntity, {
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  // Método para obtener el estado real del WebSocket
  getWebSocketStatus(): { connected: boolean; failed: boolean } {
    return {
      connected: this.isWebSocketConnected && this.socket?.connected === true,
      failed: this.webSocketFailed,
    };
  }
}
