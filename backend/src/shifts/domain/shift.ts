import { User } from '../../users/domain/user';

export enum ShiftStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

export class Shift {
  id: string;
  date: Date; // Fecha del turno (sin hora)
  globalShiftNumber: number; // Número consecutivo global de turnos
  shiftNumber: number; // Número de turno de la fecha (1, 2, 3, etc.)
  openedAt: Date;
  closedAt: Date | null;
  openedBy: User;
  closedBy: User | null;
  initialCash: number;
  finalCash: number | null;
  totalSales: number | null;
  totalOrders: number | null;
  cashDifference: number | null; // Diferencia entre efectivo esperado y contado
  status: ShiftStatus;
  notes: string | null;
  closeNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // Métodos de utilidad
  isOpen(): boolean {
    return this.status === ShiftStatus.OPEN;
  }

  isClosed(): boolean {
    return this.status === ShiftStatus.CLOSED;
  }

  canClose(): boolean {
    return this.isOpen() && this.finalCash !== null;
  }

  calculateCashDifference(expectedCash: number): number {
    if (this.finalCash === null) {
      return 0;
    }
    return this.finalCash - expectedCash;
  }
}
