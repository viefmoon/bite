import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { CategoryEntity } from '../../../../../categories/infrastructure/persistence/relational/entities/category.entity';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Entity({
  name: 'subcategory',
})
export class SubcategoryEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ name: 'category_id', type: 'varchar', length: 20 })
  categoryId: string;

  @Column({ name: 'photo_id', nullable: true })
  photoId: string | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'photo_id' })
  photo: FileEntity | null;

  @ManyToOne(() => CategoryEntity, (category) => category.subcategories, {
    nullable: false,
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoryEntity;

  @OneToMany(() => ProductEntity, (product) => product.subcategory)
  products: ProductEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
