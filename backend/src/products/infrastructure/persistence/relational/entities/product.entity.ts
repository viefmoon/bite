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
import { SubcategoryEntity } from '../../../../../subcategories/infrastructure/persistence/relational/entities/subcategory.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { ProductVariantEntity } from '../../../../../product-variants/infrastructure/persistence/relational/entities/product-variant.entity';
import { ModifierGroupEntity } from '../../../../../modifier-groups/infrastructure/persistence/relational/entities/modifier-group.entity';
import { OrderItemEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { PreparationScreenEntity } from '../../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';

@Entity({
  name: 'product',
})
export class ProductEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ default: false })
  hasVariants: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ name: 'subcategory_id' })
  subcategoryId: string;

  @Column({ name: 'photo_id', nullable: true })
  photoId: string | null;

  @Column()
  estimatedPrepTime: number;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'photo_id' })
  photo: FileEntity | null;

  @ManyToOne(() => SubcategoryEntity, {
    nullable: false,
  })
  @JoinColumn({ name: 'subcategory_id' })
  subcategory: SubcategoryEntity;

  @OneToMany(() => ProductVariantEntity, (variant) => variant.product)
  variants: ProductVariantEntity[];

  @OneToMany(() => OrderItemEntity, (orderItem) => orderItem.product)
  orderItems: OrderItemEntity[];

  @ManyToMany(() => ModifierGroupEntity)
  @JoinTable({
    name: 'product_modifier_group',
    joinColumn: {
      name: 'product_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'modifier_group_id',
      referencedColumnName: 'id',
    },
  })
  modifierGroups: ModifierGroupEntity[];

  @Column({ name: 'preparation_screen_id', nullable: true })
  preparationScreenId: string | null;

  @ManyToOne(
    () => PreparationScreenEntity,
    (preparationScreen) => preparationScreen.products,
    {
      nullable: true, // La relación ya permite nulos en la BD
    },
  )
  @JoinColumn({ name: 'preparation_screen_id' })
  preparationScreen: PreparationScreenEntity | null; // Permitir null en el tipo

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
