import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderEntity } from './order.entity';

@Entity({
  name: 'daily_order_counter',
})
@Index('UQ_daily_order_counter_date', ['date'], {
  unique: true,
  where: '"deletedAt" IS NULL',
})
export class DailyOrderCounterEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'current_number', default: 0 })
  currentNumber: number;

  @OneToMany(() => OrderEntity, (order) => order.dailyOrderCounter)
  orders: OrderEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
