import { Table } from '../../tables/domain/table';

export class Area {
  id: string;

  name: string;

  description?: string;

  isActive: boolean;

  tables: Table[];

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
