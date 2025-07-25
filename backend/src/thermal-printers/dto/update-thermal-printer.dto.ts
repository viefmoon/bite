import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIP,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsMACAddress,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PrinterConnectionType } from '../domain/thermal-printer';

export class UpdateThermalPrinterDto {
  @ApiPropertyOptional({
    type: String,
    example: 'Cocina Principal',
    description: 'Nombre descriptivo de la impresora',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    enum: PrinterConnectionType,
    example: PrinterConnectionType.NETWORK,
    description: 'Tipo de conexión de la impresora',
  })
  @IsOptional()
  @IsEnum(PrinterConnectionType)
  connectionType?: PrinterConnectionType;

  @ApiPropertyOptional({
    type: String,
    example: '192.168.1.100',
    description: 'Dirección IP (requerida si connectionType es NETWORK)',
  })
  @IsOptional()
  @ValidateIf((o) => o.connectionType === PrinterConnectionType.NETWORK)
  @IsNotEmpty({ message: 'La dirección IP es requerida para conexión NETWORK' })
  @IsIP('4', { message: 'La dirección IP no es válida' })
  ipAddress?: string | null;

  @ApiPropertyOptional({
    type: Number,
    example: 9100,
    description: 'Puerto (requerido si connectionType es NETWORK)',
  })
  @IsOptional()
  @ValidateIf((o) => o.connectionType === PrinterConnectionType.NETWORK)
  @IsNotEmpty({ message: 'El puerto es requerido para conexión NETWORK' })
  @IsInt()
  @Min(1)
  port?: number | null;

  @ApiPropertyOptional({
    type: String,
    example: '/dev/usb/lp0',
    description:
      'Ruta o identificador del dispositivo (requerido si connectionType es USB, SERIAL o BLUETOOTH)',
  })
  @IsOptional()
  @ValidateIf((o) =>
    [
      PrinterConnectionType.USB,
      PrinterConnectionType.SERIAL,
      PrinterConnectionType.BLUETOOTH,
    ].includes(o.connectionType),
  )
  @IsNotEmpty({
    message:
      'La ruta/identificador es requerido para conexiones USB/SERIAL/BLUETOOTH',
  })
  @IsString()
  path?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Indica si la impresora está activa',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '00:1A:2B:3C:4D:5E',
    description: 'Dirección MAC de la impresora (opcional)',
    nullable: true,
  })
  @IsOptional()
  @IsMACAddress({ message: 'La dirección MAC no es válida' })
  macAddress?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Marca la impresora como predeterminada para el sistema',
  })
  @IsOptional()
  @IsBoolean()
  isDefaultPrinter?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Habilita la impresión automática para órdenes de delivery',
  })
  @IsOptional()
  @IsBoolean()
  autoDeliveryPrint?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description:
      'Habilita la impresión automática para órdenes de pickup (take away)',
  })
  @IsOptional()
  @IsBoolean()
  autoPickupPrint?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 80,
    description: 'Ancho del papel en milímetros (58 o 80 son los más comunes)',
  })
  @IsOptional()
  @IsInt()
  @Min(58)
  paperWidth?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 48,
    description: 'Número de caracteres por línea en modo normal',
  })
  @IsOptional()
  @IsInt()
  @Min(32)
  charactersPerLine?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Cortar el papel automáticamente al final del ticket',
  })
  @IsOptional()
  @IsBoolean()
  cutPaper?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description:
      'Líneas en blanco a añadir al final del ticket antes del corte',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  feedLines?: number;
}
