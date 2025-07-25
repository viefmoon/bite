import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TableEntity } from '../../../../tables/infrastructure/persistence/relational/entities/table.entity';
import { AreaEntity } from '../../../../areas/infrastructure/persistence/relational/entities/area.entity';

@Injectable()
export class TableSeedService {
  constructor(
    @InjectRepository(TableEntity)
    private tableRepository: Repository<TableEntity>,
    @InjectRepository(AreaEntity)
    private areaRepository: Repository<AreaEntity>,
  ) {}

  async run() {
    // Obtener las áreas creadas
    const bar = await this.areaRepository.findOne({
      where: { name: 'Bar' },
    });
    const arco = await this.areaRepository.findOne({
      where: { name: 'Arco' },
    });
    const jardin = await this.areaRepository.findOne({
      where: { name: 'Jardin' },
    });
    const entrada = await this.areaRepository.findOne({
      where: { name: 'Entrada' },
    });
    const equipales = await this.areaRepository.findOne({
      where: { name: 'Equipales' },
    });

    if (!bar || !arco || !jardin || !entrada || !equipales) {
      return;
    }

    const tables: any[] = [];

    // Mesas del Bar (1-12)
    for (let i = 1; i <= 12; i++) {
      tables.push({
        name: i.toString(),
        area: bar,
        capacity: 4,
        isActive: true,
        isAvailable: true,
      });
    }

    // Mesas de Entrada (1-5)
    for (let i = 1; i <= 5; i++) {
      tables.push({
        name: i.toString(),
        area: entrada,
        capacity: 4,
        isActive: true,
        isAvailable: true,
      });
    }

    // Mesas de Equipales (1-2)
    for (let i = 1; i <= 2; i++) {
      tables.push({
        name: i.toString(),
        area: equipales,
        capacity: 6,
        isActive: true,
        isAvailable: true,
      });
    }

    // Mesas de Arco (1-2)
    for (let i = 1; i <= 2; i++) {
      tables.push({
        name: i.toString(),
        area: arco,
        capacity: 4,
        isActive: true,
        isAvailable: true,
      });
    }

    // Mesas de Jardin (1-4)
    for (let i = 1; i <= 4; i++) {
      tables.push({
        name: i.toString(),
        area: jardin,
        capacity: 4,
        isActive: true,
        isAvailable: true,
      });
    }

    for (const tableData of tables) {
      const existingTable = await this.tableRepository.findOne({
        where: {
          name: tableData.name,
          area: { id: tableData.area.id },
        },
      });

      if (!existingTable) {
        await this.tableRepository.save(
          this.tableRepository.create({
            ...tableData,
            isTemporary: false,
            temporaryIdentifier: null,
          }),
        );
      }
    }
  }
}
