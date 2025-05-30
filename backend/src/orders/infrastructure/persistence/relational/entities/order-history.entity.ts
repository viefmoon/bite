// src/orders/infrastructure/persistence/relational/entities/order-history.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'order_history' })
@Index(['orderId', 'changedAt']) // Índice para consultas comunes
export class OrderHistoryEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { name: 'order_id' })
  orderId: string;

  @Column({ length: 10 }) // INSERT, UPDATE, DELETE
  operation: string;

  @Column('uuid', { name: 'changed_by' })
  changedBy: string; // Asume que el ID del usuario es UUID

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;

  @Column({ type: 'jsonb', nullable: true }) // Diff puede ser nulo para INSERT/DELETE
  diff: Record<string, any> | null;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, any>; // Almacena el estado de la entidad
}
