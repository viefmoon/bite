import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  productId: string;

  @Column({ nullable: true })
  productVariantId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ type: 'jsonb', nullable: true })
  selectedPizzaIngredients: {
    pizzaIngredientId: string;
    half: 'left' | 'right' | 'full';
    action: 'add' | 'remove';
  }[];

  @Column({ type: 'jsonb', nullable: true })
  selectedModifiers: {
    modifierId: string;
  }[];

  @Column()
  orderId: string;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Order;
}