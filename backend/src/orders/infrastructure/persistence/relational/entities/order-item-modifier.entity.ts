import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  RelationId, // Añadir RelationId
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderItemEntity } from './order-item.entity';
import { ProductModifierEntity } from '../../../../../product-modifiers/infrastructure/persistence/relational/entities/product-modifier.entity';

@Entity({
  name: 'order_item_modifiers',
})
export class OrderItemModifierEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @RelationId((e: OrderItemModifierEntity) => e.orderItem)
  orderItemId: string;

  @RelationId((e: OrderItemModifierEntity) => e.productModifier)
  productModifierId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date;

  @ManyToOne(() => OrderItemEntity, (orderItem) => orderItem.modifiers)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemEntity;

  @ManyToOne(() => ProductModifierEntity)
  @JoinColumn({ name: 'product_modifier_id' })
  productModifier: ProductModifierEntity;
}
