import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { BusinessHoursEntity } from './business-hours.entity';

@Entity({
  name: 'restaurant_config',
})
export class RestaurantConfigEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Información básica
  @Column({ type: 'varchar', length: 200, default: 'Restaurant' })
  restaurantName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneMain: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phoneSecondary: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  // Configuración de operación
  @Column({ type: 'boolean', default: true })
  acceptingOrders: boolean;

  @Column({ type: 'int', default: 20 })
  estimatedPickupTime: number;

  @Column({ type: 'int', default: 40 })
  estimatedDeliveryTime: number;

  @Column({ type: 'int', default: 25 })
  estimatedDineInTime: number;

  @Column({ type: 'int', default: 30 })
  openingGracePeriod: number;

  @Column({ type: 'int', default: 30 })
  closingGracePeriod: number;

  @Column({ type: 'varchar', length: 50, default: 'America/Mexico_City' })
  timeZone: string;

  @Column({ type: 'int', default: 60 })
  scheduledOrdersLeadTime: number;

  // Configuración de delivery
  @Column({ type: 'jsonb', nullable: true })
  deliveryCoverageArea: any | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minimumOrderValueForDelivery: number;

  // Relaciones
  @OneToMany(
    () => BusinessHoursEntity,
    (businessHours) => businessHours.restaurantConfig,
  )
  businessHours: BusinessHoursEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
