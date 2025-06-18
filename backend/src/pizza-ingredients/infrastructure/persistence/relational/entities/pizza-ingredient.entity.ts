import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Entity({
  name: 'pizza_ingredient',
})
export class PizzaIngredientEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  @Column()
  name: string;

  @Column({ name: 'ingredient_value', type: 'int', default: 1 })
  ingredientValue: number;

  @Column({ type: 'text', nullable: true })
  ingredients: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @ManyToMany(() => ProductEntity, (product) => product.pizzaIngredients)
  products: ProductEntity[];

  // Importación pendiente de SelectedPizzaIngredientEntity
  // @OneToMany(() => SelectedPizzaIngredientEntity, (selected) => selected.pizzaIngredient)
  // selectedPizzaIngredients: SelectedPizzaIngredientEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}
