import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { AddressEntity } from './address.entity';
import { OrderEntity } from '../../../../../orders/infrastructure/persistence/relational/entities/order.entity';

@Entity({
  name: 'customer',
})
export class CustomerEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Index('uq_customer_phone', { unique: true })
  @Column({ type: 'varchar', length: 20 })
  phoneNumber: string;

  @Index('uq_customer_whatsapp', { unique: true, where: 'whatsappPhoneNumber IS NOT NULL' })
  @Column({ type: 'varchar', length: 20, nullable: true })
  whatsappPhoneNumber: string | null;

  @Index('uq_customer_email', { unique: true, where: 'email IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  fullChatHistory: any[] | null;

  @Column({ type: 'jsonb', nullable: true })
  relevantChatHistory: any[] | null;

  @Column({ type: 'timestamptz', nullable: true })
  lastInteraction: Date | null;

  @Column({ type: 'int', default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  bannedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  banReason: string | null;

  @OneToMany(() => AddressEntity, (address) => address.customer)
  addresses: AddressEntity[];

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders: OrderEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
