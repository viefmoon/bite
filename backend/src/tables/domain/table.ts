import { Area } from '../../areas/domain/area';

export class Table {
  id: string;

  name: string;

  areaId: string;

  capacity: number | null;

  isActive: boolean;

  isAvailable: boolean;

  isTemporary: boolean;

  temporaryIdentifier: string | null;

  area: Area;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
