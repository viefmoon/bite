import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderEntity } from './order.entity';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { ProductVariantEntity } from '../../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { PreparationStatus } from '../../../../domain/order-item';
import { AdjustmentEntity } from '../../../../../adjustments/infrastructure/persistence/relational/entities/adjustment.entity';
import { SelectedPizzaCustomizationEntity } from '../../../../../selected-pizza-customizations/infrastructure/persistence/relational/entities/selected-pizza-customization.entity';
import { ProductModifierEntity } from '../../../../../product-modifiers/infrastructure/persistence/relational/entities/product-modifier.entity';

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

  @ManyToMany(() => ProductModifierEntity)
  @JoinTable({
    name: 'order_item_product_modifiers',
    joinColumn: {
      name: 'order_item_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'product_modifier_id',
      referencedColumnName: 'id',
    },
  })
  productModifiers: ProductModifierEntity[];

  @OneToMany(() => AdjustmentEntity, (adjustment) => adjustment.orderItem)
  adjustments: AdjustmentEntity[];

  @OneToMany(
    () => SelectedPizzaCustomizationEntity,
    (selectedCustomization) => selectedCustomization.orderItem,
    { cascade: true }
  )
  selectedPizzaCustomizations: SelectedPizzaCustomizationEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
