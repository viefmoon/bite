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
  private pullInterval: NodeJS.Timeout | null = null;
  private lastPullTime: Date | null = null;
  private nextPullTime: Date | null = null;
  private pullCount = 0;
  private successfulPulls = 0;
  private failedPulls = 0;

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
      return;
    }

    this.logger.log('🚀 Iniciando servicio de sincronización...');
    this.logger.log(`⏰ Intervalo: ${this.syncConfig.intervalMinutes} minuto(s)`);
    this.logger.log(`🌐 URL: ${this.syncConfig.cloudApiUrl}`);

    // Inicializar pull automático
    this.startAutomaticPull();

    // Solo inicializar WebSocket para notificaciones en tiempo real
    if (this.syncConfig.webSocketEnabled) {
      await this.connectWebSocket();
    }

    // Hacer un pull inicial (con manejo de errores para no crashear el app)
    try {
      this.logger.log('🔄 Ejecutando sincronización inicial...');
      await this.pullChanges();
    } catch (error) {
      this.logger.error('❌ Error en sincronización inicial:', error.message);
    }
  }

  onModuleDestroy() {
    this.disconnect();
    this.stopAutomaticPull();
  }


  private connectWebSocket() {
    if (this.socket) {
      this.socket.disconnect();
    }

    const wsUrl = `${this.syncConfig.cloudApiUrl}`;

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
      this.isWebSocketConnected = false;
    });

    let errorCount = 0;
    let lastErrorLog = 0;
    this.socket.on('connect_error', (error) => {
      errorCount++;
      this.isWebSocketConnected = false;
      
      const now = Date.now();
      // Actualizar contador sin mostrar logs
    });
    
    // Eventos de reconexión
    // Eventos de reconexión sin logs
    
    // Socket.io maneja el heartbeat automáticamente
    // El servidor debe estar configurado con pingInterval y pingTimeout

    // Con reconnectionAttempts: Infinity, este evento no se disparará
    // pero lo dejamos por si cambia la configuración
    this.socket.on('reconnect_failed', () => {
      this.webSocketFailed = true;
      this.isWebSocketConnected = false;
      // Conexión fallida
    });
    
    // Resetear el estado de fallo si se logra conectar
    this.socket.on('connect', () => {
      this.isWebSocketConnected = true;
      this.webSocketFailed = false;
      errorCount = 0; // Resetear contador de errores
    });

    // Evento genérico para cualquier cambio pendiente en la nube
    this.socket.on('changes:pending', async () => {
      // Ejecutar pull de cambios
      // Esto obtendrá todos los cambios pendientes (órdenes, clientes, etc.)
      try {
        await this.pullChanges();
      } catch (error) {
        // El error ya se registra en sync_activity dentro de pullChanges
      }
    });
  }

  private disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private startAutomaticPull() {
    const intervalMs = this.syncConfig.intervalMinutes * 60 * 1000;
    
    this.logger.log(`⏱️ Pull automático configurado cada ${this.syncConfig.intervalMinutes} minuto(s)`);
    
    this.pullInterval = setInterval(async () => {
      this.pullCount++;
      this.logger.log(`🔄 Ejecutando pull automático #${this.pullCount}...`);
      try {
        await this.pullChanges();
      } catch (error) {
        this.logger.error(`❌ Error en pull automático #${this.pullCount}:`, error.message);
      }
    }, intervalMs);

    // Calcular próximo pull
    this.updateNextPullTime();
  }

  private stopAutomaticPull() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
  }

  private updateNextPullTime() {
    const intervalMs = this.syncConfig.intervalMinutes * 60 * 1000;
    this.nextPullTime = new Date(Date.now() + intervalMs);
  }


  // Nuevo método unificado para pull de cambios
  async pullChanges(confirmDto?: PullChangesRequestDto): Promise<PullChangesResponseDto> {
    this.lastPullTime = new Date();
    this.updateNextPullTime();
    
    // Primero hacer push de los datos del restaurante
    await this.pushRestaurantData();
    
    try {
      const headers = { 'X-API-Key': this.syncConfig.cloudApiKey };
      
      const url = `${this.syncConfig.cloudApiUrl}/api/sync/pull-changes`;

      // Hacer la petición al backend en la nube, incluyendo confirmaciones si existen
      const body = confirmDto || { confirmedOrders: [], confirmedCustomerIds: [] };
      const response = await firstValueFrom(
        this.httpService.post<PullChangesResponseDto>(url, body, { headers }),
      );

      const pullData = response.data;
      
      // Registrar actividad de sincronización exitosa
      await this.logSyncActivity(SyncActivityType.PULL_CHANGES, 'IN', true);
      this.successfulPulls++;

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
              // Error procesando pedido
            }
          }
        }

        // 2. Procesar clientes actualizados
        if (pullData.updated_customers && pullData.updated_customers.length > 0) {
          for (const remoteCustomer of pullData.updated_customers) {
            try {
              await this.processRemoteCustomer(manager, remoteCustomer);
            } catch (error) {
              // Error procesando cliente
            }
          }
        }
      });

      return pullData;
    } catch (error) {
      this.failedPulls++;
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
    } else {
      // Crear nuevo cliente
      await manager.save(CustomerEntity, {
        id: remoteCustomer.id,
        firstName: remoteCustomer.firstName,
        lastName: remoteCustomer.lastName,
        email: remoteCustomer.email,
        whatsappPhoneNumber: remoteCustomer.whatsappPhoneNumber,
      });
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

  // Método para hacer push de los datos del restaurante
  async pushRestaurantData(): Promise<void> {
    try {
      const headers = { 'X-API-Key': this.syncConfig.cloudApiKey };
      const url = `${this.syncConfig.cloudApiUrl}/api/sync/push-restaurant-data`;
      
      this.logger.log('📤 Iniciando push de datos del restaurante...');
      
      // Obtener el menú completo con todas las relaciones
      // getFullMenu ya incluye: modifierGroups, productModifiers, pizzaCustomizations, pizzaConfiguration
      const categories = await this.categoriesService.getFullMenu();
      this.logger.log(`✅ Menú obtenido: ${categories.length} categorías`);
      
      // Obtener la configuración completa del restaurante
      const config = await this.restaurantConfigService.getConfig();
      this.logger.log(`✅ Configuración obtenida: ${config?.restaurantName}`);
      
      // Log detallado de la configuración
      this.logger.log('📋 Configuración del restaurante completa:');
      this.logger.log(JSON.stringify({
        id: config?.id,
        restaurantName: config?.restaurantName,
        phoneMain: config?.phoneMain,
        phoneSecondary: config?.phoneSecondary,
        address: config?.address,
        city: config?.city,
        state: config?.state,
        postalCode: config?.postalCode,
        country: config?.country,
        acceptingOrders: config?.acceptingOrders,
        estimatedPickupTime: config?.estimatedPickupTime,
        estimatedDeliveryTime: config?.estimatedDeliveryTime,
        estimatedDineInTime: config?.estimatedDineInTime,
        openingGracePeriod: config?.openingGracePeriod,
        closingGracePeriod: config?.closingGracePeriod,
        timeZone: config?.timeZone,
        scheduledOrdersLeadTime: config?.scheduledOrdersLeadTime,
        deliveryCoverageArea: config?.deliveryCoverageArea,
        businessHours: config?.businessHours,
        createdAt: config?.createdAt,
        updatedAt: config?.updatedAt
      }, null, 2));
      
      // Log detallado de businessHours si existen
      if (config?.businessHours && config.businessHours.length > 0) {
        this.logger.log(`📅 Horarios de apertura (${config.businessHours.length} registros):`);
        config.businessHours.forEach(bh => {
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const dayName = dayNames[bh.dayOfWeek] || `Día ${bh.dayOfWeek}`;
          if (bh.isClosed) {
            this.logger.log(`  - ${dayName}: CERRADO`);
          } else {
            this.logger.log(`  - ${dayName}: ${bh.openingTime || 'N/A'} - ${bh.closingTime || 'N/A'}`);
          }
        });
      }
      
      // Calcular la última actualización del menú
      let menuLastUpdated = new Date(0);
      
      // Revisar categorías
      for (const category of categories) {
        if (category.updatedAt && category.updatedAt > menuLastUpdated) {
          menuLastUpdated = category.updatedAt;
        }
        // Revisar subcategorías
        if (category.subcategories) {
          for (const subcategory of category.subcategories) {
            if (subcategory.updatedAt && subcategory.updatedAt > menuLastUpdated) {
              menuLastUpdated = subcategory.updatedAt;
            }
            // Revisar productos
            if (subcategory.products) {
              for (const product of subcategory.products) {
                if (product.updatedAt && product.updatedAt > menuLastUpdated) {
                  menuLastUpdated = product.updatedAt;
                }
                // Revisar variantes de producto
                if (product.variants) {
                  for (const variant of product.variants) {
                    if (variant.updatedAt && variant.updatedAt > menuLastUpdated) {
                      menuLastUpdated = variant.updatedAt;
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      
      // Última actualización de la configuración
      const configLastUpdated = config?.updatedAt || new Date();
      
      // Convertir valores decimales de string a number
      // TypeORM devuelve decimales como strings, pero el servidor espera números
      const processedCategories = categories.map(category => ({
        ...category,
        subcategories: category.subcategories?.map(subcategory => ({
          ...subcategory,
          products: subcategory.products?.map(product => ({
            ...product,
            // Convertir campos decimales de productos
            price: product.price ? parseFloat(product.price.toString()) : null,
            // Procesar pizza configuration si existe
            pizzaConfiguration: product.pizzaConfiguration ? {
              ...product.pizzaConfiguration,
              extraToppingCost: parseFloat(product.pizzaConfiguration.extraToppingCost.toString())
            } : undefined,
            // Procesar variantes
            variants: product.variants?.map(variant => ({
              ...variant,
              price: variant.price ? parseFloat(variant.price.toString()) : 0
            })),
            // Procesar grupos de modificadores
            modifierGroups: product.modifierGroups?.map(group => ({
              ...group,
              productModifiers: group.productModifiers?.map(modifier => ({
                ...modifier,
                price: modifier.price ? parseFloat(modifier.price.toString()) : 0
              }))
            }))
          }))
        }))
      }));
      
      // Construir el body para el push con todos los datos
      const pushData = {
        menu: {
          categories: processedCategories, // Categorías con valores numéricos correctos
          lastUpdated: menuLastUpdated.toISOString()
        },
        config: {
          restaurantConfig: {
            id: config?.id,
            restaurantName: config?.restaurantName,
            phoneMain: config?.phoneMain,
            phoneSecondary: config?.phoneSecondary,
            address: config?.address,
            city: config?.city,
            state: config?.state,
            postalCode: config?.postalCode,
            country: config?.country,
            acceptingOrders: config?.acceptingOrders,
            estimatedPickupTime: config?.estimatedPickupTime,
            estimatedDeliveryTime: config?.estimatedDeliveryTime,
            estimatedDineInTime: config?.estimatedDineInTime,
            openingGracePeriod: config?.openingGracePeriod,
            closingGracePeriod: config?.closingGracePeriod,
            timeZone: config?.timeZone,
            scheduledOrdersLeadTime: config?.scheduledOrdersLeadTime,
            deliveryCoverageArea: config?.deliveryCoverageArea,
            businessHours: config?.businessHours || [],
            updatedAt: config?.updatedAt,
            createdAt: config?.createdAt
          },
          lastUpdated: configLastUpdated.toISOString()
        }
      };
      
      this.logger.log(`📡 POST ${url}`);
      this.logger.log(`📦 Enviando ${processedCategories.length} categorías con menú completo`);
      
      // Log del objeto config que se enviará
      this.logger.log('🔍 Datos de configuración a enviar:');
      this.logger.log(JSON.stringify(pushData.config, null, 2));
      
      // Hacer la petición al backend en la nube
      const response = await firstValueFrom(
        this.httpService.post(url, pushData, { headers }),
      );
      
      this.logger.log('✅ Push de datos del restaurante exitoso');
      
      // Registrar actividad exitosa
      await this.logSyncActivity(SyncActivityType.RESTAURANT_DATA, 'OUT', true);
    } catch (error) {
      this.logger.error('❌ Error en push de datos del restaurante:', error.response?.data || error.message);
      this.logger.error(`Status: ${error.response?.status}, URL: ${error.config?.url}`);
      
      // Registrar actividad fallida pero no interrumpir el pull
      await this.logSyncActivity(SyncActivityType.RESTAURANT_DATA, 'OUT', false);
      // No lanzamos el error para no interrumpir el pull de cambios
    }
  }

  // Método para notificar cambios de estado de orden a la nube
  async updateOrderStatus(
    updateDto: UpdateOrderStatusDto,
  ): Promise<UpdateOrderStatusResponseDto> {
    try {
      const headers = { 'X-API-Key': this.syncConfig.cloudApiKey };

      // Hacer la petición al backend en la nube
      const response = await firstValueFrom(
        this.httpService.post<UpdateOrderStatusResponseDto>(
          `${this.syncConfig.cloudApiUrl}/api/sync/order-status`,
          updateDto,
          { headers },
        ),
      );

      const result = response.data;
      
      // Registrar actividad exitosa
      await this.logSyncActivity(SyncActivityType.ORDER_STATUS, 'OUT', true);
      
      return result;
    } catch (error) {
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
