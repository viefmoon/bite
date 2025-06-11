import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderEntity } from './order.entity';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { ProductVariantEntity } from '../../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { OrderItemModifierEntity } from './order-item-modifier.entity';
import { PreparationStatus } from '../../../../domain/order-item';
import { AdjustmentEntity } from '../../../../../adjustments/infrastructure/persistence/relational/entities/adjustment.entity';

@Entity({
  name: 'order_item',
})
export class OrderItemEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'product_variant_id', type: 'uuid', nullable: true })
  productVariantId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  basePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  finalPrice: number;

  @Column({
    type: 'enum',
    enum: PreparationStatus,
    default: PreparationStatus.PENDING,
  })
  preparationStatus: PreparationStatus;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  statusChangedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  preparationNotes: string | null;

  @ManyToOne(() => OrderEntity, (order) => order.orderItems, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => ProductEntity, (product) => product.orderItems, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(
    () => ProductVariantEntity,
    (productVariant) => productVariant.orderItems,
    {
      eager: true,
      nullable: true,
    },
  )
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariantEntity | null;

  @OneToMany(
    () => OrderItemModifierEntity,
    (orderItemModifier) => orderItemModifier.orderItem,
  )
  modifiers: OrderItemModifierEntity[];

  @OneToMany(() => AdjustmentEntity, (adjustment) => adjustment.orderItem)
  adjustments: AdjustmentEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
