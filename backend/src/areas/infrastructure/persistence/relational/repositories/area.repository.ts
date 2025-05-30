import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository, ILike } from 'typeorm';
import { Area } from '../../../../domain/area';
import { FindAllAreasDto } from '../../../../dto/find-all-areas.dto';
import { AreaRepository } from '../../area.repository';
import { AreaEntity } from '../entities/area.entity';
import { AreaMapper } from '../mappers/area.mapper';
import { BaseRelationalRepository } from '../../../../../common/infrastructure/persistence/relational/base-relational.repository';
import { CreateAreaDto } from '../../../../dto/create-area.dto';
import { UpdateAreaDto } from '../../../../dto/update-area.dto';

@Injectable()
export class AreasRelationalRepository
  extends BaseRelationalRepository<
    AreaEntity,
    Area,
    FindAllAreasDto,
    CreateAreaDto,
    UpdateAreaDto
  >
  implements AreaRepository
{
  constructor(
    @InjectRepository(AreaEntity)
    ormRepo: Repository<AreaEntity>,
    mapper: AreaMapper,
  ) {
    super(ormRepo, mapper);
  }

  protected override buildWhere(
    filter?: FindAllAreasDto,
  ): FindOptionsWhere<AreaEntity> | undefined {
    if (!filter) return undefined;

    const where: FindOptionsWhere<AreaEntity> = {};

    if (filter.name) {
      where.name = ILike(`%${filter.name}%`);
    }
    if (filter.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    return Object.keys(where).length > 0 ? where : undefined;
  }
}
