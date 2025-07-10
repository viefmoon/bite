import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaEntity } from '../../../../areas/infrastructure/persistence/relational/entities/area.entity';

@Injectable()
export class AreaSeedService {
  constructor(
    @InjectRepository(AreaEntity)
    private repository: Repository<AreaEntity>,
  ) {}

  async run() {
    const areas = [
      {
        name: 'Bar',
        description: 'Área de bar con servicio de bebidas',
        isActive: true,
      },
      {
        name: 'Arco',
        description: 'Área con vista al arco',
        isActive: true,
      },
      {
        name: 'Jardin',
        description: 'Área exterior en el jardín',
        isActive: true,
      },
      {
        name: 'Entrada',
        description: 'Área de entrada principal',
        isActive: true,
      },
      {
        name: 'Equipales',
        description: 'Área con equipales tradicionales',
        isActive: true,
      },
    ];

    for (const areaData of areas) {
      const existingArea = await this.repository.findOne({
        where: { name: areaData.name },
      });

      if (!existingArea) {
        await this.repository.save(this.repository.create(areaData));
      }
    }
  }
}
