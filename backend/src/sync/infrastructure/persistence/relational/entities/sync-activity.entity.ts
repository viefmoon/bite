import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

export enum SyncActivityType {
  PULL_CHANGES = 'PULL_CHANGES',
  RESTAURANT_DATA = 'RESTAURANT_DATA',
  ORDER_STATUS = 'ORDER_STATUS',
}

@Entity({
  name: 'sync_activity',
})
export class SyncActivityEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SyncActivityType,
  })
  type: SyncActivityType;

  @Column({ type: 'varchar', length: 10 })
  direction: 'IN' | 'OUT'; // IN = desde la nube, OUT = hacia la nube

  @Column({ type: 'boolean', default: true })
  success: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp: Date;
}