import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({ name: 'order_item_history' })
@Index(['orderItemId', 'changedAt'])
@Index(['orderId', 'changedAt'])
export class OrderItemHistoryEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('uuid', { name: 'order_item_id' })
  orderItemId: string;

  @Column('uuid', { name: 'order_id' })
  orderId: string;

  @Column({ length: 10 })
  operation: string;

  @Column('uuid', { name: 'changed_by' })
  changedBy: string;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamptz' })
  changedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  diff: Record<string, any> | null;

  @Column({ type: 'jsonb' })
  snapshot: Record<string, any>;
}
