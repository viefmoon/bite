import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { OrderItemEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order-item.entity';
import { PizzaCustomizationEntity } from '../../../../../pizza-customizations/infrastructure/persistence/relational/entities/pizza-customization.entity';
import { CustomizationAction } from '../../../../domain/enums/customization-action.enum';
import { PizzaHalf } from '../../../../domain/enums/pizza-half.enum';

@Entity({
  name: 'selected_pizza_customization',
})
@Unique(['orderItemId', 'pizzaCustomizationId', 'half', 'action'])
export class SelectedPizzaCustomizationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @Column({ name: 'pizza_customization_id', type: 'varchar', length: 50 })
  pizzaCustomizationId: string;

  @Column({
    type: 'enum',
    enum: PizzaHalf,
    default: PizzaHalf.FULL,
  })
  half: PizzaHalf;

  @Column({
    type: 'enum',
    enum: CustomizationAction,
    default: CustomizationAction.ADD,
  })
  action: CustomizationAction;

  @ManyToOne(() => OrderItemEntity, (orderItem) => orderItem.selectedPizzaCustomizations)
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemEntity;

  @ManyToOne(
    () => PizzaCustomizationEntity,
    (pizzaCustomization) => pizzaCustomization.selectedPizzaCustomizations,
  )
  @JoinColumn({ name: 'pizza_customization_id' })
  pizzaCustomization: PizzaCustomizationEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}