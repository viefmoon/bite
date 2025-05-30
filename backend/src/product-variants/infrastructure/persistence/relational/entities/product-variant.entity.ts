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
  RelationId,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { OrderItemEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order-item.entity';

@Entity({
  name: 'product_variant',
})
export class ProductVariantEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @RelationId((variant: ProductVariantEntity) => variant.product)
  productId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => ProductEntity, (product) => product.variants, {
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.productVariant)
  orderItems: OrderItemEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
