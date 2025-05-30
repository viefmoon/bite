import {
  Injectable,
  Inject,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PrintOrderDto } from './dto/print-order.dto';
import { ThermalPrintersService } from './thermal-printers.service';
import { PrinterTypes, ThermalPrinter } from 'node-thermal-printer';
import { PrinterConnectionType } from './domain/thermal-printer';

@Injectable()
export class PrintingService {
  private readonly logger = new Logger(PrintingService.name);

  constructor(
    @Inject(OrdersService)
    private readonly ordersService: OrdersService,
    @Inject(ThermalPrintersService)
    private readonly thermalPrintersService: ThermalPrintersService,
  ) {}

  async printKitchenTicket(printOrderDto: PrintOrderDto): Promise<void> {
    const { orderId, printerId } = printOrderDto;

    const order = await this.ordersService.findOne(orderId);
    this.logger.log(`Orden ${orderId} encontrada.`);

    if (!printerId) {
      this.logger.error('No se proporcionó ID de impresora para la impresión.');
      throw new BadRequestException('Se requiere el ID de la impresora.');
    }

    const printerDetails = await this.thermalPrintersService.findOne(printerId);
    if (!printerDetails.isActive) {
      throw new BadRequestException(
        `La impresora ${printerId} no está activa.`,
      );
    }

    if (
      printerDetails.connectionType !== PrinterConnectionType.NETWORK ||
      !printerDetails.ipAddress ||
      !printerDetails.port
    ) {
      throw new BadRequestException(
        `La impresora ${printerId} no es una impresora de red válida (IP/Puerto).`,
      );
    }

    this.logger.log(
      `Usando impresora: ${printerDetails.name} (${printerDetails.ipAddress}:${printerDetails.port})`,
    );

    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: `tcp://${printerDetails.ipAddress}:${printerDetails.port}`,
    });

    try {
      const isConnected = await printer.isPrinterConnected();
      if (!isConnected) {
        this.logger.error(
          `No se pudo conectar a la impresora ${printerDetails.name} en ${printerDetails.ipAddress}:${printerDetails.port}`,
        );
        throw new InternalServerErrorException(
          'No se pudo conectar a la impresora.',
        );
      }

      this.logger.log(
        `Conectado a la impresora ${printerDetails.name}. Imprimiendo ticket de cocina...`,
      );

      printer.alignCenter();
      printer.bold(true);
      printer.println('*** TICKET DE COCINA ***');
      printer.bold(false);
      printer.newLine();

      printer.alignLeft();
      printer.println(`Orden ID: ${order.id}`);
      printer.println(`Folio del día: ${order.dailyNumber}`);

      printer.cut();

      await printer.execute();
      this.logger.log(
        `Ticket de cocina para orden ${orderId} enviado a ${printerDetails.name} exitosamente.`,
      );
    } catch (error) {
      this.logger.error(
        `Error al imprimir en ${printerDetails.name}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error al enviar la impresión: ${error.message}`,
      );
    }
  }
}
