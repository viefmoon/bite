import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TableEntity } from '../../../../../tables/infrastructure/persistence/relational/entities/table.entity';
import { CustomerEntity } from '../../../../../customers/infrastructure/persistence/relational/entities/customer.entity';
import { ShiftEntity } from '../../../../../shifts/infrastructure/persistence/relational/entities/shift.entity';
import { OrderStatus } from '../../../../domain/enums/order-status.enum';
import { OrderType } from '../../../../domain/enums/order-type.enum';
import { OrderItemEntity } from './order-item.entity';
import { PaymentEntity } from '../../../../../payments/infrastructure/persistence/relational/entities/payment.entity';
import { TicketImpressionEntity } from './ticket-impression.entity';
import { AdjustmentEntity } from '../../../../../adjustments/infrastructure/persistence/relational/entities/adjustment.entity';
import { DeliveryInfoEntity } from './delivery-info.entity';
import { OrderPreparationScreenStatusEntity } from './order-preparation-screen-status.entity';

@Entity({
  name: 'orders',
})
export class OrderEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'shift_order_number' })
  shiftOrderNumber: number;

  @Column({ name: 'shift_id', type: 'uuid' })
  shiftId: string;

  @ManyToOne(() => ShiftEntity)
  @JoinColumn({ name: 'shift_id' })
  shift: ShiftEntity;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity | null;

  @Column({ name: 'table_id', type: 'uuid', nullable: true })
  tableId: string | null;

  @ManyToOne(() => TableEntity, { nullable: true })
  @JoinColumn({ name: 'table_id' })
  table: TableEntity | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.IN_PROGRESS,
  })
  orderStatus: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.DINE_IN,
  })
  orderType: OrderType;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'customer_id', type: 'uuid', nullable: true })
  customerId: string | null;

  @ManyToOne(() => CustomerEntity, (customer) => customer.orders, {
    nullable: true,
  })
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerEntity | null;

  @Column({ name: 'is_from_whatsapp', type: 'boolean', default: false })
  isFromWhatsApp: boolean;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.order)
  orderItems: OrderItemEntity[];

  @OneToMany(() => PaymentEntity, (payment) => payment.order)
  payments: PaymentEntity[];

  @OneToMany(() => TicketImpressionEntity, (impression) => impression.order)
  ticketImpressions: TicketImpressionEntity[];

  @OneToMany(() => AdjustmentEntity, (adjustment) => adjustment.order)
  adjustments: AdjustmentEntity[];

  @OneToOne(() => DeliveryInfoEntity, (deliveryInfo) => deliveryInfo.order, {
    cascade: true,
    nullable: true,
  })
  deliveryInfo: DeliveryInfoEntity | null;

  @OneToMany(() => OrderPreparationScreenStatusEntity, (status) => status.order)
  preparationScreenStatuses: OrderPreparationScreenStatusEntity[];

  @Column({
    name: 'estimated_delivery_time',
    type: 'timestamptz',
    nullable: true,
  })
  estimatedDeliveryTime: Date | null;

  @Column({
    name: 'finalized_at',
    type: 'timestamptz',
    nullable: true,
  })
  finalizedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
