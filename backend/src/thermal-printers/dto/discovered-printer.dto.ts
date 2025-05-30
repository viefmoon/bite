import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiscoveredPrinterDto {
  @ApiProperty({
    description: 'Dirección IP de la impresora',
    example: '192.168.1.101',
  })
  ip: string;

  @ApiProperty({
    description: 'Primer puerto TCP abierto encontrado en la impresora',
    example: 9100,
  })
  port: number;

  @ApiProperty({
    description: 'Tipo de descubrimiento (siempre tcp:raw)',
    example: 'tcp:raw',
  })
  type: string; // Siempre será 'tcp:raw' ahora

  @ApiPropertyOptional({
    description: 'Nombre genérico asignado',
    example: 'Printer @ 192.168.1.101',
  })
  name?: string; // Nombre genérico

  @ApiPropertyOptional({
    description: 'Dirección MAC física obtenida de la tabla ARP del sistema',
    example: '00:1A:2B:3C:4D:5E',
  })
  mac?: string; // MAC obtenida por ARP
}
