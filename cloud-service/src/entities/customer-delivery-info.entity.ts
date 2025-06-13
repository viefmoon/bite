import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';

@Entity('customer_delivery_info')
export class CustomerDeliveryInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @Column()
  streetAddress: string;

  @Column({ nullable: true })
  neighborhood: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ nullable: true })
  pickupName: string;

  @Column({ type: 'text', nullable: true })
  additionalDetails: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Customer, customer => customer.deliveryInfo)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;
}