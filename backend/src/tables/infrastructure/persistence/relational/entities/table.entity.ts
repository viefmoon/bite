import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  RelationId,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { AreaEntity } from '../../../../../areas/infrastructure/persistence/relational/entities/area.entity';

@Entity({
  name: 'table',
})
export class TableEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @RelationId((table: TableEntity) => table.area)
  areaId: string;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ default: false })
  isTemporary: boolean;

  @Column({ type: 'varchar', nullable: true })
  temporaryIdentifier: string | null;

  @ManyToOne(() => AreaEntity, (area) => area.tables, {
    eager: true,
    nullable: false,
  })
  @JoinColumn({ name: 'area_id' })
  area: AreaEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
