import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Entity({
  name: 'pizza_ingredient',
})
export class PizzaIngredientEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'ingredient_value', type: 'int', default: 1 })
  ingredientValue: number;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'text', nullable: true })
  ingredients: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => ProductEntity, (product) => product.pizzaIngredients, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity | null;

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
