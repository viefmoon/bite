import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { ShiftStatus } from '../../../../domain/shift';

@Entity('shift')
@Index('IDX_shift_date', ['date'])
@Index('IDX_shift_status', ['status'])
@Index('IDX_shift_date_shift_number', ['date', 'shiftNumber'], { unique: true })
export class ShiftEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'global_shift_number', type: 'int' })
  globalShiftNumber: number;

  @Column({ name: 'shift_number', type: 'int', default: 1 })
  shiftNumber: number;

  @Column({ name: 'opened_at', type: 'timestamptz' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt: Date | null;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'opened_by_id' })
  openedBy: UserEntity;

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'closed_by_id' })
  closedBy: UserEntity | null;

  @Column({
    name: 'initial_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  initialCash: number;

  @Column({
    name: 'final_cash',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  finalCash: number | null;

  @Column({
    name: 'total_sales',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  totalSales: number | null;

  @Column({ name: 'total_orders', type: 'int', nullable: true })
  totalOrders: number | null;

  @Column({
    name: 'cash_difference',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) => (value ? parseFloat(value) : null),
    },
  })
  cashDifference: number | null;

  @Column({
    type: 'enum',
    enum: ShiftStatus,
    default: ShiftStatus.OPEN,
  })
  status: ShiftStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'close_notes', type: 'text', nullable: true })
  closeNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
