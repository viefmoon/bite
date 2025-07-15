import {
  Injectable,
  Inject,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { ThermalPrintersService } from './thermal-printers.service';
import { PrinterTypes, ThermalPrinter } from 'node-thermal-printer';
import { PrinterConnectionType, ThermalPrinter as ThermalPrinterEntity } from './domain/thermal-printer';
import { Order } from '../orders/domain/order';
import { OrderType } from '../orders/domain/enums/order-type.enum';
import { TicketType } from '../orders/domain/enums/ticket-type.enum';
import { TicketFormatter } from './utils/ticket-formatter';
import { CustomizationType } from '../pizza-customizations/domain/enums/customization-type.enum';
import { PizzaHalf } from '../selected-pizza-customizations/domain/enums/pizza-half.enum';
import { CustomizationAction } from '../selected-pizza-customizations/domain/enums/customization-action.enum';
import { RestaurantConfigService } from '../restaurant-config/restaurant-config.service';

// Interfaces para agrupación de items
interface GroupedOrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  modifiers: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  preparationNotes?: string;
  selectedPizzaCustomizations?: Array<{
    pizzaCustomizationId: string;
    half: PizzaHalf;
    action: CustomizationAction;
    pizzaCustomization?: {
      name: string;
      type: CustomizationType;
    };
  }>;
  preparationStatus?: string;
}

interface PizzaCustomizationGroup {
  flavors: string[];
  addedIngredients: string[];
  removedIngredients: string[];
}

@Injectable()
export class AutomaticPrintingService {
  private readonly logger = new Logger(AutomaticPrintingService.name);

  constructor(
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    @Inject(ThermalPrintersService)
    private readonly thermalPrintersService: ThermalPrintersService,
    @Inject(forwardRef(() => RestaurantConfigService))
    private readonly restaurantConfigService: RestaurantConfigService,
  ) {}

  /**
   * Función para formatear personalizaciones de pizza igual que en OrderCartDetail.tsx
   */
  private formatPizzaCustomizations(customizations: any[]): string {
    if (!customizations || customizations.length === 0) return '';

    // Agrupar por mitad y tipo
    const groupedByHalf = customizations.reduce(
      (acc, curr) => {
        const half =
          curr.half === PizzaHalf.HALF_1
            ? 'HALF_1'
            : curr.half === PizzaHalf.HALF_2
              ? 'HALF_2'
              : 'FULL';

        if (!acc[half]) {
          acc[half] = {
            flavors: [],
            addedIngredients: [],
            removedIngredients: [],
          };
        }

        // Obtener información del pizzaCustomization
        let name = '';
        let type = null;

        if (curr.pizzaCustomization) {
          // Si viene la información completa del backend
          name = curr.pizzaCustomization.name;
          type = curr.pizzaCustomization.type;
        } else {
          // Si no viene la información, usar el ID como fallback
          name = curr.pizzaCustomizationId;
        }

        if (type === CustomizationType.FLAVOR) {
          acc[half].flavors.push(name);
        } else if (type === CustomizationType.INGREDIENT) {
          if (curr.action === CustomizationAction.ADD) {
            acc[half].addedIngredients.push(name);
          } else {
            acc[half].removedIngredients.push(name);
          }
        }

        return acc;
      },
      {} as Record<string, PizzaCustomizationGroup>,
    );

    // Formatear según el tipo de pizza
    if (groupedByHalf.FULL) {
      // Pizza completa
      const parts: string[] = [];
      if (groupedByHalf.FULL.flavors.length > 0) {
        parts.push(groupedByHalf.FULL.flavors.join(', '));
      }
      if (groupedByHalf.FULL.addedIngredients.length > 0) {
        parts.push(`con: ${groupedByHalf.FULL.addedIngredients.join(', ')}`);
      }
      if (groupedByHalf.FULL.removedIngredients.length > 0) {
        parts.push(`sin: ${groupedByHalf.FULL.removedIngredients.join(', ')}`);
      }
      return parts.join(' - ');
    } else if (groupedByHalf.HALF_1 || groupedByHalf.HALF_2) {
      // Pizza mitad y mitad
      const formatHalf = (halfData: PizzaCustomizationGroup) => {
        const parts: string[] = [];
        if (halfData.flavors.length > 0) {
          parts.push(halfData.flavors.join(', '));
        }
        if (halfData.addedIngredients.length > 0) {
          parts.push(`con: ${halfData.addedIngredients.join(', ')}`);
        }
        if (halfData.removedIngredients.length > 0) {
          parts.push(`sin: ${halfData.removedIngredients.join(', ')}`);
        }
        return parts.join(' - ');
      };

      const half1 = groupedByHalf.HALF_1 ? formatHalf(groupedByHalf.HALF_1) : '';
      const half2 = groupedByHalf.HALF_2 ? formatHalf(groupedByHalf.HALF_2) : '';

      return half1 && half2 ? `(${half1} / ${half2})` : half1 || half2;
    }

    return '';
  }

  /**
   * Función para agrupar items idénticos igual que en OrderCartDetail.tsx
   */
  private groupIdenticalItems(items: any[]): GroupedOrderItem[] {
    const groupedMap = new Map<string, GroupedOrderItem>();

    items.forEach((item) => {
      // Crear una clave única basada en todas las propiedades que deben ser idénticas
      const modifierIds = (item.productModifiers || [])
        .map((mod) => mod.id)
        .sort()
        .join(',');

      // Incluir personalizaciones de pizza en la clave
      const pizzaCustomizationIds = (item.selectedPizzaCustomizations || [])
        .map((pc) => `${pc.pizzaCustomizationId}-${pc.half}-${pc.action}`)
        .sort()
        .join(',');

      const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${modifierIds}-${pizzaCustomizationIds}-${item.preparationNotes || ''}-${item.preparationStatus || 'PENDING'}`;

      const existingItem = groupedMap.get(groupKey);

      if (existingItem) {
        // Si ya existe un item idéntico, incrementar la cantidad
        existingItem.quantity += 1;
        existingItem.totalPrice += Number(item.finalPrice);
      } else {
        // Si es nuevo, agregarlo al mapa
        const groupedItem: GroupedOrderItem = {
          productId: item.productId,
          productName: item.product?.name || 'Producto',
          variantId: item.productVariantId || undefined,
          variantName: item.productVariant?.name || undefined,
          quantity: 1,
          unitPrice: Number(item.basePrice),
          totalPrice: Number(item.finalPrice),
          modifiers: (item.productModifiers || []).map((mod) => ({
            id: mod.id,
            name: mod.name,
            price: Number(mod.price) || 0,
          })),
          preparationNotes: item.preparationNotes || undefined,
          selectedPizzaCustomizations: item.selectedPizzaCustomizations || undefined,
          preparationStatus: item.preparationStatus || 'PENDING',
        };
        groupedMap.set(groupKey, groupedItem);
      }
    });

    return Array.from(groupedMap.values());
  }

  /**
   * Función para crear el título del producto igual que en OrderCartDetail.tsx
   */
  private createProductTitle(item: GroupedOrderItem): string {
    // Usar variantName si existe, sino productName
    const displayName = item.variantName || item.productName;
    return `${item.quantity}x ${displayName}`;
  }

  /**
   * Imprime automáticamente las órdenes de delivery y pickup si hay una impresora configurada
   */
  async printOrderAutomatically(orderId: string, orderType: OrderType, userId: string | null, isReprint: boolean = false): Promise<void> {
    try {
      // Solo procesar órdenes de DELIVERY o TAKE_AWAY
      if (orderType !== OrderType.DELIVERY && orderType !== OrderType.TAKE_AWAY) {
        this.logger.log(`Orden ${orderId} es de tipo ${orderType}, no requiere impresión automática.`);
        return;
      }

      // Buscar impresoras activas
      const [printers] = await this.thermalPrintersService.findAll(
        {
          isActive: true,
        },
        {
          page: 1,
          limit: 100,
        }
      );

      // Si no hay impresoras, salir
      if (!printers || printers.length === 0) {
        this.logger.log('No hay impresoras activas configuradas.');
        return;
      }

      // Filtrar impresoras según el tipo de orden
      const eligiblePrinters = printers.filter(printer => {
        if (orderType === OrderType.DELIVERY && printer.autoDeliveryPrint) {
          return true;
        }
        if (orderType === OrderType.TAKE_AWAY && printer.autoPickupPrint) {
          return true;
        }
        return false;
      });

      if (eligiblePrinters.length === 0) {
        this.logger.log(`No hay impresoras configuradas para impresión automática de ${orderType}.`);
        return;
      }

      // Usar la primera impresora elegible o la marcada como predeterminada
      const defaultPrinter = eligiblePrinters.find(p => p.isDefaultPrinter);
      const printerToUse = defaultPrinter || eligiblePrinters[0];

      this.logger.log(
        `Imprimiendo automáticamente orden ${orderId} (${orderType}) en impresora ${printerToUse.name}`,
      );

      // Imprimir el ticket
      await this.printDeliveryPickupTicket(orderId, printerToUse, userId, isReprint);

    } catch (error) {
      // No lanzar error para no interrumpir la creación de la orden
      this.logger.error(
        `Error en impresión automática de orden ${orderId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Imprime un ticket de delivery/pickup con formato específico
   */
  async printDeliveryPickupTicket(
    orderId: string,
    printerDetails: ThermalPrinterEntity,
    userId: string | null,
    isReprint: boolean = false,
  ): Promise<void> {
    const order = await this.ordersService.findOne(orderId);
    const restaurantConfig = await this.restaurantConfigService.getConfig();

    if (
      printerDetails.connectionType !== PrinterConnectionType.NETWORK ||
      !printerDetails.ipAddress ||
      !printerDetails.port
    ) {
      throw new Error(
        `La impresora ${printerDetails.id} no es una impresora de red válida.`,
      );
    }

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${printerDetails.ipAddress}:${printerDetails.port}`,
      removeSpecialCharacters: false,
      lineCharacter: '=',
    });

    try {
      const isConnected = await printer.isPrinterConnected();
      if (!isConnected) {
        throw new Error(
          `No se pudo conectar a la impresora ${printerDetails.name}`,
        );
      }

      // Inicializar formateador con la configuración de la impresora
      const formatter = new TicketFormatter(printerDetails.paperWidth as 58 | 80);

      // Encabezado del ticket
      printer.alignCenter();
      
      // Número de orden y tipo con separador claro (primero)
      printer.setTextSize(1, 2);
      printer.bold(true);
      
      // Construir el título con indicadores
      let orderTitle = `#${order.shiftOrderNumber} - `;
      
      // Tipo de orden (comprimido)
      if (order.orderType === OrderType.DELIVERY) {
        orderTitle += 'DOMICILIO';
      } else {
        orderTitle += 'PARA LLEVAR';
      }
      
      // Agregar indicadores
      if (order.scheduledAt) {
        orderTitle += ' (P)'; // P para pedido Programado
      }
      
      if (isReprint) {
        orderTitle += ' *'; // Asterisco para reimpresión/edición
      }
      
      printer.println(orderTitle);
      
      printer.bold(false);
      printer.setTextNormal();
      
      printer.drawLine();
      
      // Información del restaurante (después del número de orden)
      printer.alignCenter();
      
      // Nombre del restaurante
      printer.setTextSize(1, 1);
      printer.bold(true);
      printer.println(restaurantConfig.restaurantName || 'Restaurant');
      printer.bold(false);
      printer.setTextNormal();
      
      // Dirección del restaurante
      if (restaurantConfig.address) {
        printer.println(restaurantConfig.address);
        if (restaurantConfig.city || restaurantConfig.state || restaurantConfig.postalCode) {
          const cityStateParts = [
            restaurantConfig.city,
            restaurantConfig.state,
            restaurantConfig.postalCode
          ].filter(Boolean).join(', ');
          printer.println(cityStateParts);
        }
      }
      
      // Teléfonos
      if (restaurantConfig.phoneMain || restaurantConfig.phoneSecondary) {
        const phones: string[] = [];
        if (restaurantConfig.phoneMain) phones.push(`Tel: ${restaurantConfig.phoneMain}`);
        if (restaurantConfig.phoneSecondary) phones.push(`Tel 2: ${restaurantConfig.phoneSecondary}`);
        printer.println(phones.join(' - '));
      }
      
      printer.drawLine();

      // Información de la orden (fecha creación, actualización y quien atendió)
      printer.alignLeft();
      printer.println(`Fecha: ${new Date(order.createdAt).toLocaleString('es-MX', { 
        timeZone: 'America/Mexico_City' 
      })}`);
      
      // Mostrar fecha de actualización si es diferente a la creación
      if (order.updatedAt && new Date(order.updatedAt).getTime() !== new Date(order.createdAt).getTime()) {
        printer.println(`Actualizada: ${new Date(order.updatedAt).toLocaleString('es-MX', { 
          timeZone: 'America/Mexico_City' 
        })}`);
      }
      
      if (order.user?.firstName || order.user?.lastName) {
        const userName = [order.user.firstName, order.user.lastName].filter(Boolean).join(' ');
        printer.println(`Atendido por: ${userName}`);
      }
      
      // Mostrar notas de orden y hora programada si existen y no se mostrarán en secciones específicas
      if ((order.notes || order.scheduledAt) && !order.deliveryInfo) {
        if (order.notes) {
          printer.setTextSize(0, 1); // Fuente intermedia
          printer.println(`Notas de orden: ${order.notes}`);
          printer.setTextNormal(); // Volver a fuente normal
        }
        if (order.scheduledAt) {
          printer.setTextSize(0, 1); // Fuente intermedia
          printer.println(`Hora programada: ${new Date(order.scheduledAt).toLocaleTimeString('es-MX', { 
            timeZone: 'America/Mexico_City',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}`);
          printer.setTextNormal(); // Volver a fuente normal
        }
      }

      // Información de entrega para pedidos delivery
      if (order.orderType === OrderType.DELIVERY && order.deliveryInfo) {
        printer.drawLine();
        printer.bold(true);
        printer.println('INFORMACION DE ENTREGA:');
        printer.bold(false);
        
        // Usar fuente más grande para información de entrega
        printer.setTextSize(1, 1);
        
        if (order.deliveryInfo.recipientName) {
          printer.println(`Cliente: ${order.deliveryInfo.recipientName}`);
        }
        if (order.deliveryInfo.fullAddress) {
          printer.println(`Direccion: ${order.deliveryInfo.fullAddress}`);
        } else if (order.deliveryInfo.street) {
          const addressParts = [
            order.deliveryInfo.street,
            order.deliveryInfo.number,
            order.deliveryInfo.interiorNumber ? `Int. ${order.deliveryInfo.interiorNumber}` : '',
            order.deliveryInfo.neighborhood,
            order.deliveryInfo.city,
          ].filter(Boolean).join(', ');
          printer.println(`Direccion: ${addressParts}`);
        }
        
        if (order.deliveryInfo.deliveryInstructions) {
          printer.println(`Instrucciones: ${order.deliveryInfo.deliveryInstructions}`);
        }
        
        // Combinar teléfono, notas y hora programada en líneas optimizadas
        printer.setTextSize(0, 1); // Fuente intermedia
        
        const phone = order.deliveryInfo.recipientPhone ? `Tel: ${order.deliveryInfo.recipientPhone}` : null;
        const notes = order.notes ? `Notas: ${order.notes}` : null;
        const scheduledTime = order.scheduledAt ? `Hora programada: ${new Date(order.scheduledAt).toLocaleTimeString('es-MX', { 
          timeZone: 'America/Mexico_City',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}` : null;
        
        // Combinar campos disponibles
        const fields: string[] = [phone, notes, scheduledTime].filter((field): field is string => field !== null);
        
        if (fields.length === 3) {
          // Si hay 3 campos, imprimir teléfono solo, y notas + hora juntas
          printer.println(fields[0]); // Teléfono
          printer.println(`${fields[1]} | ${fields[2]}`); // Notas | Hora
        } else if (fields.length === 2) {
          // Si hay 2 campos, combinarlos en una línea
          printer.println(`${fields[0]} | ${fields[1]}`);
        } else if (fields.length === 1) {
          // Si hay solo 1 campo, imprimirlo solo
          printer.println(fields[0]);
        }
        
        printer.setTextSize(1, 1); // Volver a fuente de información de entrega
        
        // Volver a fuente normal
        printer.setTextNormal();
      }
      
      // Para pedidos pickup, mostrar información de recolección de deliveryInfo
      if (order.orderType === OrderType.TAKE_AWAY && order.deliveryInfo) {
        printer.drawLine();
        printer.bold(true);
        printer.println('RECOLECCION:');
        printer.bold(false);
        
        // Usar fuente más grande para información de recolección
        printer.setTextSize(1, 1);
        
        if (order.deliveryInfo.recipientName) {
          printer.println(`Nombre: ${order.deliveryInfo.recipientName}`);
        }
        
        if (order.deliveryInfo.deliveryInstructions) {
          printer.println(`Notas: ${order.deliveryInfo.deliveryInstructions}`);
        }
        
        // Combinar teléfono, notas y hora programada en líneas optimizadas
        printer.setTextSize(0, 1); // Fuente intermedia
        
        const phone = order.deliveryInfo.recipientPhone ? `Tel: ${order.deliveryInfo.recipientPhone}` : null;
        const notes = order.notes ? `Notas: ${order.notes}` : null;
        const scheduledTime = order.scheduledAt ? `Hora programada: ${new Date(order.scheduledAt).toLocaleTimeString('es-MX', { 
          timeZone: 'America/Mexico_City',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}` : null;
        
        // Combinar campos disponibles
        const fields: string[] = [phone, notes, scheduledTime].filter((field): field is string => field !== null);
        
        if (fields.length === 3) {
          // Si hay 3 campos, imprimir teléfono solo, y notas + hora juntas
          printer.println(fields[0]); // Teléfono
          printer.println(`${fields[1]} | ${fields[2]}`); // Notas | Hora
        } else if (fields.length === 2) {
          // Si hay 2 campos, combinarlos en una línea
          printer.println(`${fields[0]} | ${fields[1]}`);
        } else if (fields.length === 1) {
          // Si hay solo 1 campo, imprimirlo solo
          printer.println(fields[0]);
        }
        
        printer.setTextSize(1, 1); // Volver a fuente de información de recolección
        
        // Volver a fuente normal
        printer.setTextNormal();
      }

      // Items de la orden
      printer.drawLine();
      printer.bold(true);
      printer.println('PRODUCTOS:');
      printer.bold(false);

      // Agrupar items idénticos
      const groupedItems = this.groupIdenticalItems(order.orderItems || []);

      // Calcular el ancho máximo necesario para los precios
      let maxPriceWidth = 0;
      for (const item of groupedItems) {
        const priceStr = formatter.formatMoney(item.totalPrice);
        maxPriceWidth = Math.max(maxPriceWidth, priceStr.length);
      }
      // Añadir 2 caracteres de margen
      const dynamicPriceColumnWidth = maxPriceWidth + 2;

      // Usar fuente más grande para los productos
      printer.setTextSize(1, 1); // Fuente ligeramente más grande
      
      for (const item of groupedItems) {
        // Crear título del producto igual que en OrderCartDetail.tsx
        const productTitle = this.createProductTitle(item);
        
        // Imprimir producto principal con formato de tabla estricto
        // IMPORTANTE: Usar 'expanded' porque estamos usando setTextSize(1,1)
        const productLines = formatter.formatProductTable(
          productTitle, 
          formatter.formatMoney(item.totalPrice),
          'expanded', // Cambiado a expanded para coincidir con el tamaño de fuente
          dynamicPriceColumnWidth // Pasar el ancho de columna calculado dinámicamente
        );
        
        // Imprimir todas las líneas del producto
        for (const line of productLines) {
          printer.println(line);
        }

        // Personalizaciones de pizza (fuente intermedia)
        if (item.selectedPizzaCustomizations && item.selectedPizzaCustomizations.length > 0) {
          const pizzaCustomizations = this.formatPizzaCustomizations(item.selectedPizzaCustomizations);
          if (pizzaCustomizations) {
            printer.setTextSize(0, 1); // Fuente intermedia para personalizaciones
            printer.println(`  ${pizzaCustomizations}`);
            printer.setTextSize(1, 1); // Regresar a fuente grande para productos
          }
        }

        // Modificadores (fuente intermedia)
        if (item.modifiers && item.modifiers.length > 0) {
          printer.setTextSize(0, 1); // Fuente intermedia para modificadores
          for (const modifier of item.modifiers) {
            let modifierText: string;
            if (modifier.price > 0) {
              // Si hay múltiples unidades, indicar que el precio es por c/u
              if (item.quantity > 1) {
                modifierText = `• ${modifier.name} (+${formatter.formatMoney(modifier.price)} c/u)`;
              } else {
                modifierText = `• ${modifier.name} (+${formatter.formatMoney(modifier.price)})`;
              }
            } else {
              modifierText = `• ${modifier.name}`;
            }
            printer.println(`  ${modifierText}`);
          }
          printer.setTextSize(1, 1); // Regresar a fuente grande para productos
        }

        // Notas de preparación con wrap (fuente intermedia)
        if (item.preparationNotes) {
          printer.setTextSize(0, 1); // Fuente intermedia para notas
          const wrappedNotes = formatter.wrapText(`  Notas: ${item.preparationNotes}`, 'normal');
          for (const line of wrappedNotes) {
            printer.println(line);
          }
          printer.setTextSize(1, 1); // Regresar a fuente grande para productos
        }
      }

      // Volver a fuente normal después de los productos
      printer.setTextNormal();

      // Total
      printer.drawLine();
      printer.alignLeft();
      
      // Calcular el ancho máximo necesario para los totales
      const subtotalStr = formatter.formatMoney(Number(order.subtotal));
      const totalStr = formatter.formatMoney(Number(order.total));
      const maxTotalWidth = Math.max(subtotalStr.length, totalStr.length) + 2;
      
      // Subtotal
      const subtotalLines = formatter.formatProductTable(
        'Subtotal:', 
        subtotalStr,
        'normal',
        maxTotalWidth
      );
      for (const line of subtotalLines) {
        printer.println(line);
      }
      
      // Total con fuente grande
      const totalLines = formatter.formatProductTable(
        'TOTAL:', 
        totalStr,
        'expanded', // Usamos expanded porque vamos a usar fuente grande
        maxTotalWidth
      );
      printer.setTextSize(1, 2);
      printer.bold(true);
      for (const line of totalLines) {
        printer.println(line);
      }
      printer.setTextNormal();
      printer.bold(false);


      // Notas adicionales (solo si no se mostraron en información de entrega)
      if (order.notes && !order.deliveryInfo) {
        printer.alignLeft();
        printer.drawLine();
        printer.bold(true);
        printer.println('NOTAS:');
        printer.bold(false);
        printer.println(order.notes);
      }

      // Pie del ticket
      printer.drawLine();
      printer.alignCenter();
      printer.println('¡Gracias por su preferencia!');

      // Añadir líneas de avance según configuración
      for (let i = 0; i < printerDetails.feedLines; i++) {
        printer.newLine();
      }

      // Cortar papel si está habilitado
      if (printerDetails.cutPaper) {
        printer.cut();
      }

      await printer.execute();

      // Registrar la impresión
      const ticketType = order.orderType === OrderType.DELIVERY 
        ? TicketType.GENERAL 
        : TicketType.GENERAL;

      // Solo registrar impresión si hay un userId válido
      if (userId) {
        await this.ordersService.registerTicketImpression(
          orderId,
          userId,
          ticketType,
          printerDetails.id,
        );
      }

      this.logger.log(
        `Ticket de ${order.orderType} para orden ${orderId} impreso exitosamente en ${printerDetails.name}.`,
      );
    } catch (error) {
      this.logger.error(
        `Error al imprimir ticket de ${order.orderType}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}