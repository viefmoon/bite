import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { SubcategoryEntity } from '../../../../../subcategories/infrastructure/persistence/relational/entities/subcategory.entity';

@Entity({
  name: 'category',
})
export class CategoryEntity extends EntityRelationalHelper {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ name: 'photo_id', nullable: true })
  photoId: string | null;

  @ManyToOne(() => FileEntity, { nullable: true })
  @JoinColumn({ name: 'photo_id' })
  photo: FileEntity | null;

  @OneToMany(() => SubcategoryEntity, (subcategory) => subcategory.category)
  subcategories: SubcategoryEntity[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
