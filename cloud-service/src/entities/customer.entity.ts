import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { CustomerDeliveryInfo } from './customer-delivery-info.entity';
import { Order } from './order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column({ type: 'timestamp', nullable: true })
  lastInteraction: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => CustomerDeliveryInfo, deliveryInfo => deliveryInfo.customer)
  deliveryInfo: CustomerDeliveryInfo;

  @OneToMany(() => Order, order => order.customer)
  orders: Order[];
}