import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { OrderEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order.entity';
import { OrderItemEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'adjustment',
})
@Index(['orderId'])
@Index(['orderItemId'])
export class AdjustmentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  orderId?: string | null;

  @ManyToOne(() => OrderEntity, (order) => order.adjustments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order?: OrderEntity;

  @Column({ type: 'uuid', nullable: true })
  orderItemId?: string | null;

  @ManyToOne(() => OrderItemEntity, (orderItem) => orderItem.adjustments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderItemId' })
  orderItem?: OrderItemEntity;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', default: false })
  isPercentage: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'uuid' })
  appliedById: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'appliedById' })
  appliedBy: UserEntity;

  @Column({ type: 'timestamp' })
  appliedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
