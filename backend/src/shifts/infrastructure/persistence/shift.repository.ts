import { Shift, ShiftStatus } from '../../domain/shift';

export abstract class ShiftRepository {
  abstract create(shift: Shift): Promise<Shift>;

  abstract findById(id: string): Promise<Shift | null>;

  abstract findByDate(date: Date): Promise<Shift | null>;

  abstract findAllByDate(date: Date): Promise<Shift[]>;

  abstract findCurrent(): Promise<Shift | null>;

  abstract findLastClosed(): Promise<Shift | null>;

  abstract findByStatus(status: ShiftStatus): Promise<Shift[]>;

  abstract update(id: string, payload: Partial<Shift>): Promise<Shift | null>;

  abstract getNextGlobalShiftNumber(): Promise<number>;
}
