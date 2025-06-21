import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { ProductEntity } from '../../../../../products/infrastructure/persistence/relational/entities/product.entity';

@Entity({
  name: 'pizza_configuration',
})
export class PizzaConfigurationEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid', unique: true })
  productId: string;

  @OneToOne(() => ProductEntity, (product) => product.pizzaConfiguration)
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column({ name: 'included_toppings', type: 'int', default: 4 })
  includedToppings: number;

  @Column({
    name: 'extra_topping_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 20,
  })
  extraToppingCost: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;
}