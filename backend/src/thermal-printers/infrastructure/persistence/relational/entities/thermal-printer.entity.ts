import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { PrinterConnectionType } from '../../../../domain/thermal-printer';

@Entity({
  name: 'thermal_printer',
})
export class ThermalPrinterEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'enum', enum: PrinterConnectionType })
  connectionType: PrinterConnectionType;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'int', nullable: true })
  port: number | null;

  @Column({ type: 'varchar', nullable: true })
  path: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Index()
  @Column({ type: 'varchar', length: 17, nullable: true })
  macAddress: string | null;
  @Column({ type: 'boolean', default: false })
  isDefaultPrinter: boolean;

  @Column({ type: 'boolean', default: false })
  autoDeliveryPrint: boolean;

  @Column({ type: 'boolean', default: false })
  autoPickupPrint: boolean;

  @Column({ type: 'int', default: 80 })
  paperWidth: number; // Ancho del papel en mm (58 o 80 típicamente)

  @Column({ type: 'int', default: 48 })
  charactersPerLine: number; // Caracteres por línea en modo normal

  @Column({ type: 'boolean', default: true })
  cutPaper: boolean; // Si debe cortar el papel al final

  @Column({ type: 'int', default: 3 })
  feedLines: number; // Líneas en blanco al final del ticket

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
