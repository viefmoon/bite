import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { OrderItem } from './order-item.entity';

export type OrderStatus = 'created' | 'accepted' | 'in_preparation' | 'prepared' | 'in_delivery' | 'finished' | 'canceled';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true })
  dailyOrderNumber: number;

  @Column({
    type: 'enum',
    enum: ['delivery', 'pickup'],
  })
  orderType: 'delivery' | 'pickup';

  @Column({
    type: 'enum',
    enum: ['created', 'accepted', 'in_preparation', 'prepared', 'in_delivery', 'finished', 'canceled'],
    default: 'created',
  })
  status: OrderStatus;

  @Column({ type: 'float' })
  totalCost: number;

  @Column()
  customerId: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'int', nullable: true })
  estimatedTime: number;

  @Column({ type: 'timestamp', nullable: true })
  scheduledDeliveryTime: Date;

  @Column({ default: false })
  syncedWithLocal: boolean;

  @Column({ type: 'int', nullable: true })
  localId: number;

  @Column({ nullable: true })
  whatsappMessageId: string;

  // Delivery info
  @Column({ nullable: true })
  deliveryAddress: string;

  @Column({ type: 'text', nullable: true })
  deliveryAdditionalDetails: string;

  @Column({ type: 'float', nullable: true })
  deliveryLatitude: number;

  @Column({ type: 'float', nullable: true })
  deliveryLongitude: number;

  @Column({ nullable: true })
  pickupName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Customer, customer => customer.orders)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];
}