import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  ManyToOne,
  ManyToMany,
  JoinTable,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleEntity } from '../../../../../roles/infrastructure/persistence/relational/entities/role.entity';
import { GenderEnum } from '../../../../enums/gender.enum';
import { PreparationScreenEntity } from '../../../../../preparation-screens/infrastructure/persistence/relational/entities/preparation-screen.entity';

import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'user',
})
export class UserEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true, nullable: true })
  email: string | null;

  @Column({ type: String, unique: true, nullable: false })
  username: string;

  @Column({ nullable: true })
  password?: string;

  @Index()
  @Column({ type: String, nullable: true })
  firstName: string | null;

  @Index()
  @Column({ type: String, nullable: true })
  lastName: string | null;

  @Column({ type: 'date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'enum', enum: GenderEnum, nullable: true })
  gender: GenderEnum | null;

  @Column({ type: String, nullable: true })
  phoneNumber: string | null;

  @Column({ type: String, nullable: true })
  address: string | null;

  @Column({ type: String, nullable: true })
  city: string | null;

  @Column({ type: String, nullable: true })
  state: string | null;

  @Column({ type: String, nullable: true })
  country: string | null;

  @Column({ type: String, nullable: true })
  zipCode: string | null;

  @Column({ type: 'jsonb', nullable: true })
  emergencyContact: Record<string, any> | null;

  @ManyToOne(() => RoleEntity, {
    eager: true,
    nullable: false,
  })
  role: RoleEntity;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ManyToMany(() => PreparationScreenEntity, { eager: false })
  @JoinTable({
    name: 'user_preparation_screens',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'preparation_screen_id',
      referencedColumnName: 'id',
    },
  })
  preparationScreens?: PreparationScreenEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
