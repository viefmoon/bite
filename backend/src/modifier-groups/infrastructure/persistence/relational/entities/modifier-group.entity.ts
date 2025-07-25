import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ProductModifierEntity } from '../../../../../product-modifiers/infrastructure/persistence/relational/entities/product-modifier.entity';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Entity({
  name: 'modifier_group',
})
export class ModifierGroupEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  minSelections: number;

  @Column({ type: 'int' })
  maxSelections: number;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ default: false })
  allowMultipleSelections: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(
    () => ProductModifierEntity,
    (productModifier) => productModifier.modifierGroup,
  )
  productModifiers: ProductModifierEntity[];

  @ManyToMany(() => ProductEntity, (product) => product.modifierGroups)
  products: ProductEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
