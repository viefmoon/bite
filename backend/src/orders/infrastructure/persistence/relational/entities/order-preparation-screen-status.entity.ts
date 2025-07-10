import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderEntity } from './order.entity';
import { PreparationScreenEntity } from '../../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { PreparationScreenStatus } from '../../../../domain/order-preparation-screen-status';

@Entity({
  name: 'order_preparation_screen_status',
})
@Unique(['orderId', 'preparationScreenId'])
@Index(['orderId', 'status'])
export class OrderPreparationScreenStatusEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'preparation_screen_id', type: 'uuid' })
  preparationScreenId: string;

  @Column({
    type: 'enum',
    enum: PreparationScreenStatus,
    default: PreparationScreenStatus.PENDING,
  })
  status: PreparationScreenStatus;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'started_by_id', type: 'uuid', nullable: true })
  startedById: string | null;

  @Column({ name: 'completed_by_id', type: 'uuid', nullable: true })
  completedById: string | null;

  @ManyToOne(() => OrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => PreparationScreenEntity)
  @JoinColumn({ name: 'preparation_screen_id' })
  preparationScreen: PreparationScreenEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'started_by_id' })
  startedBy: UserEntity | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'completed_by_id' })
  completedBy: UserEntity | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
