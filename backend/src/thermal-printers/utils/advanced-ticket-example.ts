/**
 * Ejemplo de ticket avanzado con más funcionalidades
 * Este archivo muestra cómo usar funciones adicionales de la impresora
 */

import { ThermalPrinter, PrinterTypes } from 'node-thermal-printer';
import { TicketFormatter } from './ticket-formatter';

export class AdvancedTicketExample {
  
  /**
   * Imprime un ticket con funcionalidades avanzadas
   */
  static async printAdvancedTicket(printer: ThermalPrinter, order: any) {
    const formatter = new TicketFormatter(80);
    
    // Logo o imagen (si tienes un logo)
    // printer.printImage('./assets/logo.png');
    
    // Encabezado con estilos variados
    printer.alignCenter();
    printer.setTextSize(2, 2);
    printer.bold(true);
    printer.println('MI RESTAURANTE');
    printer.setTextNormal();
    printer.bold(false);
    
    // Información con texto invertido
    printer.invert(true);
    printer.println(' TICKET DE VENTA ');
    printer.invert(false);
    
    printer.newLine();
    
    // Código de barras con el número de orden
    // Usamos el método code128 que es más conveniente
    const orderCode = String(order.shiftOrderNumber).padStart(8, '0');
    printer.code128(orderCode, {
      width: 'LARGE',
      height: 80,
      text: 2  // Texto en la parte inferior
    });
    
    printer.newLine();
    
    // Información en recuadro
    const boxLines = formatter.createBox(
      `Orden #${order.shiftOrderNumber} - ${new Date().toLocaleDateString('es-MX')}`
    );
    for (const line of boxLines) {
      printer.println(line);
    }
    
    printer.newLine();
    
    // Tabla de productos con 3 columnas
    printer.println(formatter.createDivider('='));
    const headerRow = formatter.formatTable([
      { col1: 'PRODUCTO', col2: 'CANT', col3: 'PRECIO' }
    ]);
    printer.bold(true);
    printer.println(headerRow[0]);
    printer.bold(false);
    printer.println(formatter.createDivider('-'));
    
    // Productos con formato de 3 columnas
    const productRows = order.orderItems.map((item: any) => ({
      col1: item.product.name.substring(0, 25),
      col2: '1',
      col3: `$${item.finalPrice}`
    }));
    
    const formattedProducts = formatter.formatTable(productRows);
    for (const line of formattedProducts) {
      printer.println(line);
    }
    
    printer.println(formatter.createDivider('='));
    
    // Código QR con URL de seguimiento
    printer.alignCenter();
    printer.newLine();
    printer.println('Seguimiento en línea:');
    printer.printQR(`https://mirestaurante.com/orden/${order.id}`, {
      cellSize: 6,
      correction: 'M',
      model: 2
    });
    
    printer.newLine();
    
    // Mensaje con diferentes tamaños
    printer.setTextSize(0, 1); // Texto más pequeño
    printer.println('Conserve este ticket para cualquier aclaración');
    printer.setTextNormal();
    
    // Sonido de alerta (útil para notificar al cajero)
    printer.beep(2, 3); // 2 beeps, 3 * 100ms cada uno
    
    // Abrir cajón de dinero (si está conectado)
    // printer.openCashDrawer();
    
    // Corte del papel
    printer.cut();
    
    return printer.execute();
  }
  
  /**
   * Ejemplo de ticket de cocina con formato especial
   */
  static async printKitchenTicket(printer: ThermalPrinter, order: any) {
    const formatter = new TicketFormatter(80);
    
    // Encabezado urgente
    printer.alignCenter();
    printer.invert(true);
    printer.setTextSize(2, 2);
    printer.println(' COCINA ');
    printer.invert(false);
    printer.setTextNormal();
    
    // Hora grande
    printer.setTextSize(1, 2);
    printer.println(new Date().toLocaleTimeString('es-MX'));
    printer.setTextNormal();
    
    // Número de orden muy grande
    printer.setTextSize(3, 3);
    printer.bold(true);
    printer.println(`#${order.shiftOrderNumber}`);
    printer.bold(false);
    printer.setTextNormal();
    
    // Tipo de orden con recuadro
    const orderTypeBox = formatter.createBox(order.orderType);
    for (const line of orderTypeBox) {
      printer.println(line);
    }
    
    printer.drawLine();
    
    // Items con checkbox para marcar
    printer.alignLeft();
    for (const item of order.orderItems) {
      printer.setTextSize(1, 2);
      printer.bold(true);
      printer.println(`[ ] ${item.product.name}`);
      printer.setTextNormal();
      printer.bold(false);
      
      if (item.productVariant) {
        printer.println(`    Variante: ${item.productVariant.name}`);
      }
      
      if (item.productModifiers?.length > 0) {
        printer.println('    Modificadores:');
        for (const mod of item.productModifiers) {
          printer.println(`    - ${mod.name}`);
        }
      }
      
      if (item.preparationNotes) {
        printer.invert(true);
        printer.println(` NOTA: ${item.preparationNotes} `);
        printer.invert(false);
      }
      
      printer.newLine();
    }
    
    // Notas generales en texto grande
    if (order.notes) {
      printer.drawLine();
      printer.setTextSize(1, 2);
      printer.bold(true);
      printer.println('NOTAS ESPECIALES:');
      printer.bold(false);
      const wrappedNotes = formatter.wrapText(order.notes, 'expanded');
      for (const line of wrappedNotes) {
        printer.println(line);
      }
      printer.setTextNormal();
    }
    
    // Múltiples beeps para cocina
    printer.beep(3, 5); // 3 beeps largos
    
    printer.cut();
    
    return printer.execute();
  }
}