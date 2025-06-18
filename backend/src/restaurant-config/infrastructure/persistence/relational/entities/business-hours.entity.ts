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
import { RestaurantConfigEntity } from './restaurant-config.entity';

@Entity({
  name: 'business_hours',
})
@Unique(['restaurantConfigId', 'dayOfWeek']) // Un solo horario por día
export class BusinessHoursEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  dayOfWeek: number; // 0 = Domingo, 1 = Lunes, ... 6 = Sábado

  @Column({ type: 'time', nullable: true })
  openingTime: string | null; // Hora de apertura en formato HH:mm (null = cerrado)

  @Column({ type: 'time', nullable: true })
  closingTime: string | null; // Hora de cierre en formato HH:mm (null = cerrado)

  @Column({ type: 'boolean', default: false })
  isClosed: boolean; // true si el restaurante está cerrado ese día

  @Column({ name: 'restaurant_config_id', type: 'uuid' })
  restaurantConfigId: string;

  @ManyToOne(() => RestaurantConfigEntity, (config) => config.businessHours)
  @JoinColumn({ name: 'restaurant_config_id' })
  restaurantConfig: RestaurantConfigEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}