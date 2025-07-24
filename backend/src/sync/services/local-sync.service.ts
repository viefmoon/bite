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
import { SyncActivityEntity, SyncActivityType } from '../infrastructure/persistence/relational/entities/sync-activity.entity';
import { PullChangesRequestDto } from '../dto/pull-changes-request.dto';
import { ShiftEntity } from '../../shifts/infrastructure/persistence/relational/entities/shift.entity';
import { ShiftStatus } from '../../shifts/domain/shift';

@Injectable()
export class LocalSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocalSyncService.name);
  private socket: Socket | null = null;
  private readonly syncConfig: SyncConfig;
  private isWebSocketConnected = false;
  private webSocketFailed = false;
  private pullInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private pullCount = 0;

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
    this.logger.log(`🔌 WebSocket habilitado: ${this.syncConfig.webSocketEnabled}`);

    // Inicializar pull automático
    this.startAutomaticPull();

    // Solo inicializar WebSocket para notificaciones en tiempo real
    if (this.syncConfig.webSocketEnabled) {
      try {
        await this.connectWebSocket();
      } catch (error) {
        this.logger.error('❌ Error al conectar WebSocket:', error.message);
        this.logger.warn('⚠️ Continuando sin WebSocket, usando solo pull periódico');
      }
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
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    // Limpiar referencia global
    if ((global as any).__syncSocket) {
      delete (global as any).__syncSocket;
    }
  }


  private async connectWebSocket(): Promise<void> {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // Configuración para producción con HTTPS y Nginx
    const wsUrl = this.syncConfig.cloudApiUrl;
    const isProduction = wsUrl.includes('https://');
    const fullUrl = `${wsUrl}/sync`;
    
    this.logger.log(`📡 Conectando WebSocket a ${fullUrl}...`);
    
    const socketOptions = {
      auth: {
        apiKey: this.syncConfig.cloudApiKey
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      secure: isProduction,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      forceNew: true
    };

    // Conectar al namespace /sync con configuración para producción
    this.socket = io(fullUrl, socketOptions);


    // Evento de desconexión
    this.socket.on('disconnect', (reason) => {
      this.isWebSocketConnected = false;
      this.logger.warn(`⚠️ WebSocket desconectado: ${reason}`);
    });

    // Evento de error de conexión
    this.socket.on('connect_error', (error) => {
      this.isWebSocketConnected = false;
      // Solo mostrar error si es la primera vez o cada 5 intentos
      if (!this.webSocketFailed) {
        this.logger.error(`❌ Error de conexión WebSocket: ${error.message}`);
        this.webSocketFailed = true;
      }
    });
    
    
    
    // Evento de conexión exitosa
    this.socket.on('connect', () => {
      this.isWebSocketConnected = true;
      this.webSocketFailed = false;
      this.logger.log(`✅ WebSocket conectado (ID: ${this.socket?.id})`);
    });

    // Evento genérico para cualquier cambio pendiente en la nube
    this.socket.on('changes:pending', async () => {
      this.logger.log('📨 Evento recibido: changes:pending');
      // Ejecutar pull de cambios
      // Esto obtendrá todos los cambios pendientes (órdenes, clientes, etc.)
      try {
        await this.pullChanges();
      } catch (error) {
        // El error ya se registra en sync_activity dentro de pullChanges
      }
    });
    
    // Evento de reconexión exitosa
    this.socket.io.on('reconnect', (attempt) => {
      this.logger.log(`✅ WebSocket reconectado después de ${attempt} intentos`);
      this.isWebSocketConnected = true;
    });
    
    // Solo mostrar intentos de reconexión cada 5 intentos
    let reconnectAttempts = 0;
    this.socket.io.on('reconnect_attempt', (attempt) => {
      reconnectAttempts = attempt;
      if (attempt === 1 || attempt % 5 === 0) {
        this.logger.log(`🔄 Intentando reconectar... (intento #${attempt})`);
      }
    });
    
    this.socket.io.on('reconnect_failed', () => {
      this.logger.error(`❌ Reconexión fallida después de ${reconnectAttempts} intentos`);
      this.webSocketFailed = true;
    });

    // Esperar a que se conecte o falle
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        this.logger.error('❌ Timeout esperando conexión WebSocket');
        reject(new Error('WebSocket connection timeout'));
      }, 30000); // 30 segundos de timeout

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        
        // Mantener referencia al socket para evitar que se destruya
        // Reducir intervalo a 20 segundos para evitar timeouts
        this.heartbeatInterval = setInterval(() => {
          if (this.socket?.connected) {
            // Emitir un ping manual para mantener la conexión viva
            this.socket.emit('ping');
            this.socket.emit('heartbeat', { timestamp: new Date().toISOString() });
          } else if (!this.socket?.io?._reconnecting) {
            // Solo reconectar si no está ya intentándolo
            this.socket?.connect();
          }
        }, 20000); // Cada 20 segundos
        
        // IMPORTANTE: Mantener el socket vivo
        (global as any).__syncSocket = this.socket;
        
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
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
  }

  private stopAutomaticPull() {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }
  }

  // Nuevo método unificado para pull de cambios
  async pullChanges(confirmDto?: PullChangesRequestDto): Promise<PullChangesResponseDto> {
    
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

      this.logger.log(
        `📥 Recibidos: ${pullData.pending_orders?.length || 0} pedidos, ${
          pullData.updated_customers?.length || 0
        } clientes actualizados`,
      );

      // Log de estructura de pedidos recibidos
      if (pullData.pending_orders && pullData.pending_orders.length > 0) {
        this.logger.log('📋 Estructura de pedidos recibidos:');
        pullData.pending_orders.forEach((order, index) => {
          this.logger.log(`  Pedido ${index + 1}/${pullData.pending_orders.length}:`);
          this.logger.log(`    - ID: ${order.id}`);
          this.logger.log(`    - Cliente: ${order.customer?.firstName || 'N/A'} ${order.customer?.lastName || ''}`);
          this.logger.log(`    - Tipo: ${order.orderType}`);
          this.logger.log(`    - Estado: ${order.orderStatus}`);
          this.logger.log(`    - Total: $${order.total || order.subtotal || 0}`);
          this.logger.log(`    - Items: ${order.orderItems?.length || 0}`);
          if (order.deliveryInfo) {
            this.logger.log(`    - Entrega a: ${order.deliveryInfo.recipientName || 'N/A'}`);
          }
        });
      }

      // Log de estructura de clientes actualizados
      if (pullData.updated_customers && pullData.updated_customers.length > 0) {
        this.logger.log('👥 Clientes actualizados:');
        pullData.updated_customers.forEach((customer, index) => {
          this.logger.log(`  Cliente ${index + 1}/${pullData.updated_customers.length}:`);
          this.logger.log(`    - ID: ${customer.id}`);
          this.logger.log(`    - Nombre: ${customer.firstName} ${customer.lastName || ''}`);
          this.logger.log(`    - WhatsApp: ${customer.whatsappPhoneNumber || 'N/A'}`);
          this.logger.log(`    - Direcciones: ${customer.addresses?.length || 0}`);
        });
      }

      // Si no hay cambios pendientes, retornar inmediatamente
      if (
        (!pullData.pending_orders || pullData.pending_orders.length === 0) &&
        (!pullData.updated_customers || pullData.updated_customers.length === 0)
      ) {
        return pullData;
      }

      // Procesar pedidos pendientes (cada uno en su propia transacción)
      if (pullData.pending_orders && pullData.pending_orders.length > 0) {
        this.logger.log(`🔄 Iniciando procesamiento de ${pullData.pending_orders.length} pedidos...`);
        let processedCount = 0;
        let skippedNoShiftCount = 0;
        let errorCount = 0;
        
        for (const remoteOrder of pullData.pending_orders) {
          try {
            this.logger.log(`  ⏳ Procesando pedido ${remoteOrder.id}...`);
            // Cada pedido en su propia transacción
            await this.dataSource.transaction(async (manager) => {
              await this.processRemoteOrder(manager, remoteOrder);
            });
            processedCount++;
            this.logger.log(`  ✅ Pedido ${remoteOrder.id} procesado exitosamente`);
          } catch (error) {
            if (error.message === 'No hay shift abierto para sincronizar órdenes') {
              skippedNoShiftCount++;
              // No mostrar stack trace para este caso específico
            } else {
              errorCount++;
              this.logger.error(`  ❌ Error procesando pedido ${remoteOrder.id}:`, error.message);
              if (error.stack) {
                this.logger.error(`     Stack: ${error.stack}`);
              }
            }
            // Continuar con el siguiente pedido aunque este falle
          }
        }
        
        const parts = [`📊 Resumen: ${processedCount} procesados`];
        if (skippedNoShiftCount > 0) {
          parts.push(`${skippedNoShiftCount} esperando shift`);
        }
        if (errorCount > 0) {
          parts.push(`${errorCount} errores`);
        }
        this.logger.log(parts.join(', '));
      }

      // Procesar clientes actualizados (cada uno en su propia transacción)
      if (pullData.updated_customers && pullData.updated_customers.length > 0) {
        this.logger.log(`👥 Procesando ${pullData.updated_customers.length} clientes actualizados...`);
        let customerProcessed = 0;
        let customerErrors = 0;
        
        for (const remoteCustomer of pullData.updated_customers) {
          try {
            await this.dataSource.transaction(async (manager) => {
              await this.processRemoteCustomer(manager, remoteCustomer);
            });
            customerProcessed++;
          } catch (error) {
            customerErrors++;
            this.logger.error(`  ❌ Error procesando cliente ${remoteCustomer.id}:`, error.message);
          }
        }
        
        if (customerErrors > 0) {
          this.logger.log(`  📊 Clientes: ${customerProcessed} procesados, ${customerErrors} errores`);
        }
      }

      return pullData;
    } catch (error) {
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
    this.logger.log(`    🔍 Verificando si existe orden ${remoteOrder.id}...`);
    
    // Verificar si la orden ya existe
    const existingOrder = await manager.findOne(OrderEntity, {
      where: { id: remoteOrder.id },
    });

    if (existingOrder) {
      this.logger.log(`    ⚠️ Orden ${remoteOrder.id} ya existe, saltando...`);
      return;
    }
    
    // Verificar si hay un shift abierto antes de procesar
    const activeShift = await manager.findOne(ShiftEntity, {
      where: { status: ShiftStatus.OPEN },
      order: { openedAt: 'DESC' },
    });
    
    if (!activeShift) {
      this.logger.warn(`    ⏸️ No hay shift abierto. Orden ${remoteOrder.id} se sincronizará cuando se abra un shift.`);
      throw new Error('No hay shift abierto para sincronizar órdenes');
    }
    
    this.logger.log(`    ✨ Orden ${remoteOrder.id} no existe, creando nueva...`);

    // Usar el shift activo que ya verificamos que existe
    const shiftId = remoteOrder.shiftId || activeShift.id;
    const shiftOrderNumber = await this.getNextShiftOrderNumber(manager, shiftId);
    this.logger.log(`    📝 Número de orden del turno: ${shiftOrderNumber} (Shift: ${shiftId})`)

    // Procesar cliente si existe
    let customer: CustomerEntity | null = null;
    if (remoteOrder.customer) {
      this.logger.log(`    👤 Procesando cliente ${remoteOrder.customer.id}...`);
      customer = await this.findOrCreateCustomer(
        manager,
        remoteOrder.customer,
      );
      this.logger.log(`    ✅ Cliente procesado: ${customer.id}`);
    }

    // Crear la orden con todos los campos relevantes
    this.logger.log(`    💾 Guardando orden en base de datos...`);
    const order = await manager.save(OrderEntity, {
      id: remoteOrder.id,
      customer,
      customerId: customer?.id || remoteOrder.customerId || null,
      shiftOrderNumber,
      shiftId: shiftId,
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
    
    this.logger.log(`    ✅ Orden guardada con ID: ${order.id}, Número: ${order.shiftOrderNumber}`);

    // Guardar delivery info si existe
    if (remoteOrder.deliveryInfo) {
      this.logger.log(`    🚚 Guardando información de entrega...`);
      await this.saveDeliveryInfo(manager, order, remoteOrder.deliveryInfo, customer);
    }

    // Guardar order items con todas sus relaciones
    if (remoteOrder.orderItems && remoteOrder.orderItems.length > 0) {
      this.logger.log(`    📦 Guardando ${remoteOrder.orderItems.length} items de la orden...`);
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
    
    this.logger.log(`    🎉 Orden ${remoteOrder.id} procesada completamente con ${remoteOrder.orderItems?.length || 0} items`);
  }

  // Método auxiliar para procesar un cliente remoto
  private async processRemoteCustomer(
    manager: any,
    remoteCustomer: Customer,
  ): Promise<void> {
    // Buscar cliente existente por ID o WhatsApp
    let existingCustomer = await manager.findOne(CustomerEntity, {
      where: { id: remoteCustomer.id },
    });

    // Si no existe por ID, buscar por WhatsApp
    if (!existingCustomer && remoteCustomer.whatsappPhoneNumber) {
      existingCustomer = await manager.findOne(CustomerEntity, {
        where: { whatsappPhoneNumber: remoteCustomer.whatsappPhoneNumber },
      });
    }

    if (existingCustomer) {
      // Actualizar cliente existente
      await manager.update(CustomerEntity, { id: existingCustomer.id }, {
        firstName: remoteCustomer.firstName,
        lastName: remoteCustomer.lastName,
        email: remoteCustomer.email,
        whatsappPhoneNumber: remoteCustomer.whatsappPhoneNumber,
      });
      
      // Si el ID del cliente remoto es diferente, actualizar también el ID
      if (existingCustomer.id !== remoteCustomer.id) {
        this.logger.warn(`Cliente con WhatsApp ${remoteCustomer.whatsappPhoneNumber} ya existe con ID diferente. Local: ${existingCustomer.id}, Remoto: ${remoteCustomer.id}`);
      }
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
    const whatsappNumber = customerData.phoneNumber || customerData.whatsappPhoneNumber;
    
    // Buscar cliente existente por ID
    if (customerData.id) {
      const customerById = await manager.findOne(CustomerEntity, {
        where: { id: customerData.id },
      });
      if (customerById) {
        this.logger.log(`      ✅ Cliente encontrado por ID: ${customerById.id}`);
        return customerById;
      }
    }
    
    // Buscar por WhatsApp si existe
    if (whatsappNumber) {
      const customerByWhatsApp = await manager.findOne(CustomerEntity, {
        where: { whatsappPhoneNumber: whatsappNumber },
      });
      if (customerByWhatsApp) {
        this.logger.log(`      ✅ Cliente encontrado por WhatsApp: ${customerByWhatsApp.id}`);
        // Actualizar el ID si es diferente
        if (customerData.id && customerByWhatsApp.id !== customerData.id) {
          this.logger.warn(`      ⚠️ Cliente con WhatsApp ${whatsappNumber} tiene ID diferente. Local: ${customerByWhatsApp.id}, Remoto: ${customerData.id}`);
        }
        return customerByWhatsApp;
      }
    }
    
    // Si no existe, crear nuevo cliente
    this.logger.log(`      ✨ Creando nuevo cliente: ${customerData.firstName} ${customerData.lastName || ''}`);
    const customer = await manager.save(CustomerEntity, {
      id: customerData.id,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      email: customerData.email,
      whatsappPhoneNumber: whatsappNumber,
    });

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
  private async getNextShiftOrderNumber(manager: any, shiftId: string | null): Promise<number> {
    if (!shiftId) {
      return 1;
    }
    
    const lastOrder = await manager.findOne(OrderEntity, {
      where: { shiftId },
      order: { shiftOrderNumber: 'DESC' },
      select: ['shiftOrderNumber'],
    });

    return lastOrder ? lastOrder.shiftOrderNumber + 1 : 1;
  }

  // Método auxiliar para obtener el shift actual
  private async getCurrentShiftId(manager: any): Promise<string | null> {
    // Buscar el shift activo actual
    const activeShift = await manager.findOne(ShiftEntity, {
      where: { status: ShiftStatus.OPEN },
      order: { openedAt: 'DESC' },
    });

    if (activeShift) {
      return activeShift.id;
    }

    // Si no hay shift activo, buscar el último shift cerrado del día
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastShiftToday = await manager.findOne(ShiftEntity, {
      where: { date: today },
      order: { shiftNumber: 'DESC' },
    });
    
    if (lastShiftToday) {
      return lastShiftToday.id;
    }
    
    // Si no hay ningún shift del día, buscar el último shift en general
    const lastShift = await manager.findOne(ShiftEntity, {
      order: { openedAt: 'DESC' },
    });
    
    if (lastShift) {
      this.logger.warn(`⚠️ No hay shift activo, usando el último shift disponible: ${lastShift.id}`);
      return lastShift.id;
    }
    
    // Si no hay ningún shift en el sistema, retornar null
    this.logger.error('❌ No hay ningún shift en el sistema. Las órdenes se crearán sin shift.');
    return null;
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
