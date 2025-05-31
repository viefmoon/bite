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

@Entity({
  name: 'customer',
})
export class CustomerEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Index('uq_customer_phone', {
    unique: true,
    where: '"phoneNumber" IS NOT NULL',
  })
  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneNumber: string | null;

  @Index('uq_customer_email', { unique: true, where: 'email IS NOT NULL' })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @OneToMany(() => AddressEntity, (address) => address.customer)
  addresses: AddressEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
