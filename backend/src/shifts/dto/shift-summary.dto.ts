import { ApiProperty } from '@nestjs/swagger';
import { ShiftStatus } from '../domain/shift';

export class ShiftSummaryDto {
  @ApiProperty({
    description: 'ID del turno',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id: string;

  @ApiProperty({
    description: 'Fecha del turno',
    example: '2024-01-15',
  })
  date: Date;

  @ApiProperty({
    description: 'Número consecutivo global del turno',
    example: 145,
  })
  globalShiftNumber: number;

  @ApiProperty({
    description: 'Número de turno de la fecha',
    example: 1,
  })
  shiftNumber: number;

  @ApiProperty({
    description: 'Estado del turno',
    enum: ShiftStatus,
    example: ShiftStatus.OPEN,
  })
  status: ShiftStatus;

  @ApiProperty({
    description: 'Hora de apertura',
    example: '2024-01-15T11:00:00Z',
  })
  openedAt: Date;

  @ApiProperty({
    description: 'Hora de cierre',
    example: '2024-01-16T02:30:00Z',
    nullable: true,
  })
  closedAt: Date | null;

  @ApiProperty({
    description: 'Usuario que abrió el turno',
    example: { id: 'user-id', firstName: 'Juan', lastName: 'Pérez' },
  })
  openedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };

  @ApiProperty({
    description: 'Usuario que cerró el turno',
    example: { id: 'user-id', firstName: 'María', lastName: 'García' },
    nullable: true,
  })
  closedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;

  @ApiProperty({
    description: 'Efectivo inicial',
    example: 500.0,
  })
  initialCash: number;

  @ApiProperty({
    description: 'Efectivo final',
    example: 2500.0,
    nullable: true,
  })
  finalCash: number | null;

  @ApiProperty({
    description: 'Total de ventas del turno',
    example: 2000.0,
    nullable: true,
  })
  totalSales: number | null;

  @ApiProperty({
    description: 'Total de órdenes del turno',
    example: 45,
    nullable: true,
  })
  totalOrders: number | null;

  @ApiProperty({
    description: 'Diferencia de efectivo (final - esperado)',
    example: 0.0,
    nullable: true,
  })
  cashDifference: number | null;

  @ApiProperty({
    description: 'Efectivo esperado (inicial + ventas en efectivo)',
    example: 2500.0,
    nullable: true,
  })
  expectedCash?: number | null;

  @ApiProperty({
    description: 'Notas de apertura',
    example: 'Apertura normal',
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Notas de cierre',
    example: 'Todo cuadra correctamente',
    nullable: true,
  })
  closeNotes: string | null;
}
