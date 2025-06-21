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
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';
import { CustomizationType } from '../../../../domain/enums/customization-type.enum';
import { SelectedPizzaCustomizationEntity } from '../../../../../selected-pizza-customizations/infrastructure/persistence/relational/entities/selected-pizza-customization.entity';

@Entity({
  name: 'pizza_customization',
})
export class PizzaCustomizationEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CustomizationType,
    default: CustomizationType.INGREDIENT,
  })
  type: CustomizationType;

  @Column({ type: 'text', nullable: true })
  ingredients: string | null;

  @Column({ name: 'topping_value', type: 'int', default: 1 })
  toppingValue: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToMany(() => ProductEntity, (product) => product.pizzaCustomizations)
  products: ProductEntity[];

  @OneToMany(
    () => SelectedPizzaCustomizationEntity,
    (selected) => selected.pizzaCustomization,
  )
  selectedPizzaCustomizations: SelectedPizzaCustomizationEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}