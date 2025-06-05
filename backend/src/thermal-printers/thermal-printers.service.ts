import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ThermalPrinterRepository } from './infrastructure/persistence/thermal-printer.repository';
import { CreateThermalPrinterDto } from './dto/create-thermal-printer.dto';
import { UpdateThermalPrinterDto } from './dto/update-thermal-printer.dto';
import {
  ThermalPrinter,
  PrinterConnectionType,
} from './domain/thermal-printer';
import { FindAllThermalPrintersDto } from './dto/find-all-thermal-printers.dto';
import { IPaginationOptions } from '../utils/types/pagination-options';
import net from 'net';
import { QueryFailedError } from 'typeorm';
import { ERROR_CODES } from '../common/constants/error-codes.constants';
import { Inject } from '@nestjs/common';
import { THERMAL_PRINTER_REPOSITORY } from '../common/tokens';

@Injectable()
export class ThermalPrintersService {
  private readonly logger = new Logger(ThermalPrintersService.name);
  constructor(
    @Inject(THERMAL_PRINTER_REPOSITORY)
    private readonly thermalPrinterRepository: ThermalPrinterRepository,
  ) {}

  async create(createDto: CreateThermalPrinterDto): Promise<ThermalPrinter> {
    const existingPrinterByName =
      await this.thermalPrinterRepository.findByName(createDto.name);
    if (existingPrinterByName) {
      throw new ConflictException({
        code: ERROR_CODES.THERMAL_PRINTER_DUPLICATE_FIELD,
        message: `Ya existe una impresora con el nombre '${createDto.name}'.`,
        details: { field: 'name' },
      });
    }

    if (
      createDto.connectionType === PrinterConnectionType.NETWORK &&
      createDto.ipAddress
    ) {
      const existingPrinterByIp =
        await this.thermalPrinterRepository.findByIpAddress(
          createDto.ipAddress,
        );
      if (existingPrinterByIp) {
        throw new ConflictException({
          code: ERROR_CODES.THERMAL_PRINTER_DUPLICATE_FIELD,
          message: `Ya existe una impresora con la dirección IP '${createDto.ipAddress}'.`,
          details: { field: 'ipAddress' },
        });
      }
    }

    const printer = new ThermalPrinter();
    printer.name = createDto.name;
    printer.connectionType = createDto.connectionType;
    printer.ipAddress = createDto.ipAddress || null;
    printer.port = createDto.port || null;
    printer.path = createDto.path || null;
    printer.isActive = createDto.isActive ?? true;
    printer.macAddress = createDto.macAddress || null;

    try {
      return await this.thermalPrinterRepository.create(printer);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        const detail = error.driverError?.detail || '';
        let field = 'desconocido';
        if (detail.includes('ipAddress')) {
          field = 'dirección IP';
        } else if (detail.includes('name')) {
          field = 'nombre';
        }

        throw new ConflictException({
          code: ERROR_CODES.THERMAL_PRINTER_DUPLICATE_FIELD,
          message: `Ya existe una impresora con el mismo ${field}.`,
          details: { field: field },
        });
      }
      throw error;
    }
  }

  async findAll(
    filterOptions: FindAllThermalPrintersDto,
    paginationOptions: IPaginationOptions,
  ): Promise<[ThermalPrinter[], number]> {
    return this.thermalPrinterRepository.findManyWithPagination({
      filterOptions,
      paginationOptions,
    });
  }

  async findOne(id: string): Promise<ThermalPrinter> {
    const printer = await this.thermalPrinterRepository.findById(id);
    if (!printer) {
      throw new NotFoundException(`Impresora con ID ${id} no encontrada.`);
    }
    return printer;
  }

  async update(
    id: string,
    updateDto: UpdateThermalPrinterDto,
  ): Promise<ThermalPrinter> {
    const existingPrinter = await this.findOne(id);

    if (updateDto.name && updateDto.name !== existingPrinter.name) {
      const conflictingPrinter = await this.thermalPrinterRepository.findByName(
        updateDto.name,
      );
      if (conflictingPrinter && conflictingPrinter.id !== id) {
        throw new ConflictException({
          code: ERROR_CODES.THERMAL_PRINTER_DUPLICATE_FIELD,
          message: `Ya existe otra impresora con el nombre '${updateDto.name}'.`,
          details: { field: 'name' },
        });
      }
    }

    if (
      (updateDto.connectionType === PrinterConnectionType.NETWORK ||
        (updateDto.connectionType === undefined &&
          existingPrinter.connectionType === PrinterConnectionType.NETWORK)) &&
      updateDto.ipAddress &&
      updateDto.ipAddress !== existingPrinter.ipAddress
    ) {
      const conflictingPrinterByIp =
        await this.thermalPrinterRepository.findByIpAddress(
          updateDto.ipAddress,
        );
      if (conflictingPrinterByIp && conflictingPrinterByIp.id !== id) {
        throw new ConflictException({
          code: ERROR_CODES.THERMAL_PRINTER_DUPLICATE_FIELD,
          message: `Ya existe otra impresora con la dirección IP '${updateDto.ipAddress}'.`,
          details: { field: 'ipAddress' },
        });
      }
    }

    const updatePayload: Partial<ThermalPrinter> = {
      name: updateDto.name,
      connectionType: updateDto.connectionType,
      ipAddress: updateDto.ipAddress,
      port: updateDto.port,
      path: updateDto.path,
      isActive: updateDto.isActive,
      macAddress: updateDto.macAddress,
    };

    Object.keys(updatePayload).forEach(
      (key) => updatePayload[key] === undefined && delete updatePayload[key],
    );

    const updatedPrinter = await this.thermalPrinterRepository.update(
      id,
      updatePayload,
    );

    if (!updatedPrinter) {
      throw new NotFoundException(`Impresora con ID ${id} no encontrada.`);
    }

    try {
      const updatedPrinter = await this.thermalPrinterRepository.update(
        id,
        updatePayload,
      );

      if (!updatedPrinter) {
        throw new NotFoundException(
          `Impresora con ID ${id} no encontrada después de intentar actualizar.`,
        );
      }

      return updatedPrinter;
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError?.code === '23505'
      ) {
        const detail = error.driverError?.detail || '';
        let field = 'desconocido';
        if (detail.includes('ipAddress')) {
          field = 'dirección IP';
        } else if (detail.includes('name')) {
          field = 'nombre';
        }

        throw new ConflictException({
          code: ERROR_CODES.THERMAL_PRINTER_DUPLICATE_FIELD,
          message: `Ya existe otra impresora con el mismo ${field}.`,
          details: { field: field },
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    return this.thermalPrinterRepository.remove(id);
  }

  async pingPrinter(id: string): Promise<{ status: string }> {
    this.logger.log(`Intentando hacer ping a la impresora con ID: ${id}`);
    const printer = await this.findOne(id);

    if (printer.connectionType !== PrinterConnectionType.NETWORK) {
      this.logger.warn(
        `Ping no aplicable para tipo de conexión: ${printer.connectionType}`,
      );
      throw new BadRequestException(
        `La prueba de ping solo es aplicable a impresoras con conexión NETWORK.`,
      );
    }

    if (!printer.ipAddress || !printer.port) {
      this.logger.error(
        `La impresora ${id} es NETWORK pero no tiene IP o puerto configurado.`,
      );
      throw new BadRequestException(
        'La impresora no tiene configurada una dirección IP o puerto para realizar el ping.',
      );
    }

    const host = printer.ipAddress;
    const port = printer.port;
    const timeout = 2000;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;

      socket.setTimeout(timeout);

      socket.on('connect', () => {
        connected = true;
        this.logger.log(`Ping exitoso a ${host}:${port}`);
        socket.end();
        resolve({ status: 'online' });
      });

      socket.on('timeout', () => {
        this.logger.warn(`Timeout al intentar conectar a ${host}:${port}`);
        socket.destroy();
        resolve({ status: 'offline' });
      });

      socket.on('error', (err) => {
        this.logger.error(
          `Error de conexión a ${host}:${port}: ${err.message}`,
        );
        socket.destroy();
        resolve({ status: 'offline' });
      });

      socket.on('close', () => {
        if (!connected) {
          this.logger.log(`Socket cerrado sin conexión a ${host}:${port}`);
          resolve({ status: 'offline' });
        }
      });

      this.logger.log(`Intentando conexión TCP a ${host}:${port}...`);
      socket.connect(port, host);
    });
  }

  async testPrint(printerInfo: {
    ip: string;
    port: number;
    connectionType: string;
  }): Promise<{ success: boolean; message?: string }> {
    this.logger.log(
      `Intentando imprimir ticket de prueba en ${printerInfo.ip}:${printerInfo.port}`,
    );

    const net = require('net');
    const timeout = 5000;

    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;

      socket.setTimeout(timeout);

      socket.on('connect', async () => {
        connected = true;
        this.logger.log(`Conectado a ${printerInfo.ip}:${printerInfo.port}`);
        
        try {
          // Comandos ESC/POS para el ticket de prueba
          const commands = [
            '\x1B\x40', // Inicializar impresora
            '\x1B\x61\x01', // Centrar texto
            '\x1B\x21\x30', // Texto doble altura y ancho
            'TICKET DE PRUEBA\n',
            '\x1B\x21\x00', // Texto normal
            '\x1B\x61\x00', // Alinear izquierda
            '\n',
            `Fecha: ${new Date().toLocaleString()}\n`,
            `IP: ${printerInfo.ip}\n`,
            `Puerto: ${printerInfo.port}\n`,
            '\n',
            '\x1B\x61\x01', // Centrar texto
            'Impresora configurada correctamente\n',
            '\n',
            '\x1B\x61\x00', // Alinear izquierda
            '================================\n',
            '\n\n\n',
            '\x1D\x56\x00', // Cortar papel
          ];

          const buffer = Buffer.from(commands.join(''), 'binary');
          
          socket.write(buffer, () => {
            this.logger.log('Ticket de prueba enviado exitosamente');
            socket.end();
            resolve({
              success: true,
              message: 'Ticket de prueba impreso correctamente',
            });
          });
        } catch (error) {
          this.logger.error('Error al enviar ticket de prueba:', error);
          socket.end();
          resolve({
            success: false,
            message: 'Error al enviar datos a la impresora',
          });
        }
      });

      socket.on('error', (err) => {
        this.logger.error(`Error de conexión: ${err.message}`);
        resolve({
          success: false,
          message: `No se pudo conectar a la impresora: ${err.message}`,
        });
      });

      socket.on('timeout', () => {
        this.logger.warn('Timeout al conectar con la impresora');
        socket.destroy();
        if (!connected) {
          resolve({
            success: false,
            message: 'Tiempo de espera agotado al conectar con la impresora',
          });
        }
      });

      this.logger.log(
        `Intentando conexión TCP a ${printerInfo.ip}:${printerInfo.port}...`,
      );
      socket.connect(printerInfo.port, printerInfo.ip);
    });
  }
}
