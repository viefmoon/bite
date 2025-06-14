import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'restaurant_config',
})
export class RestaurantConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'boolean', default: true })
  acceptingOrders: boolean;

  @Column({ type: 'int', default: 30 })
  estimatedPickupTime: number;

  @Column({ type: 'int', default: 45 })
  estimatedDeliveryTime: number;

  @Column({ type: 'time', nullable: true })
  openingTime: string | null;

  @Column({ type: 'time', nullable: true })
  closingTime: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
