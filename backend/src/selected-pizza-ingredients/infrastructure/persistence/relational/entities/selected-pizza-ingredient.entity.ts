import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PizzaIngredientEntity } from '../../../../../pizza-ingredients/infrastructure/persistence/relational/entities/pizza-ingredient.entity';
import { OrderItemEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { PizzaHalf } from '../../../../domain/enums/pizza-half.enum';
import { IngredientAction } from '../../../../domain/enums/ingredient-action.enum';

@Entity({
  name: 'selected_pizza_ingredient',
})
export class SelectedPizzaIngredientEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: PizzaHalf,
    default: PizzaHalf.FULL,
  })
  half: PizzaHalf;

  @Column({ name: 'pizza_ingredient_id', type: 'uuid' })
  pizzaIngredientId: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @Column({
    type: 'enum',
    enum: IngredientAction,
    default: IngredientAction.ADD,
  })
  action: IngredientAction;

  @ManyToOne(() => PizzaIngredientEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pizza_ingredient_id' })
  pizzaIngredient: PizzaIngredientEntity;

  @ManyToOne(() => OrderItemEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
