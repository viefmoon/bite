import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIP,
  IsInt,
  IsNotEmpty,
  IsOptional,
  // IsPort, // Eliminado ya que no se usa
  IsString,
  IsMACAddress,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { PrinterConnectionType } from '../domain/thermal-printer';

export class CreateThermalPrinterDto {
  @ApiProperty({
    type: String,
    example: 'Cocina Principal',
    description: 'Nombre descriptivo de la impresora',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    enum: PrinterConnectionType,
    example: PrinterConnectionType.NETWORK,
    description: 'Tipo de conexión de la impresora',
  })
  @IsNotEmpty()
  @IsEnum(PrinterConnectionType)
  connectionType: PrinterConnectionType;

  @ApiPropertyOptional({
    type: String,
    example: '192.168.1.100',
    description: 'Dirección IP (requerida si connectionType es NETWORK)',
  })
  @IsOptional()
  @ValidateIf((o) => o.connectionType === PrinterConnectionType.NETWORK)
  @IsNotEmpty({ message: 'La dirección IP es requerida para conexión NETWORK' })
  @IsIP('4', { message: 'La dirección IP no es válida' })
  ipAddress?: string;

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
  port?: number;

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
  path?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Indica si la impresora está activa',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: String,
    example: '00:1A:2B:3C:4D:5E',
    description: 'Dirección MAC de la impresora (opcional)',
  })
  @IsOptional()
  @IsMACAddress({ message: 'La dirección MAC no es válida' })
  macAddress?: string;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Marca la impresora como predeterminada para el sistema',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefaultPrinter?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description: 'Habilita la impresión automática para órdenes de delivery',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoDeliveryPrint?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    example: false,
    description:
      'Habilita la impresión automática para órdenes de pickup (take away)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoPickupPrint?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 80,
    description: 'Ancho del papel en milímetros (58 o 80 son los más comunes)',
    default: 80,
  })
  @IsOptional()
  @IsInt()
  @Min(58)
  paperWidth?: number;

  @ApiPropertyOptional({
    type: Number,
    example: 48,
    description: 'Número de caracteres por línea en modo normal',
    default: 48,
  })
  @IsOptional()
  @IsInt()
  @Min(32)
  charactersPerLine?: number;

  @ApiPropertyOptional({
    type: Boolean,
    example: true,
    description: 'Cortar el papel automáticamente al final del ticket',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  cutPaper?: boolean;

  @ApiPropertyOptional({
    type: Number,
    example: 3,
    description:
      'Líneas en blanco a añadir al final del ticket antes del corte',
    default: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  feedLines?: number;
}
