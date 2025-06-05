import { Injectable, Inject } from '@nestjs/common';
import { Area } from './domain/area';
import { CreateAreaDto } from './dto/create-area.dto';
import { FindAllAreasDto } from './dto/find-all-areas.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { AreaRepository } from './infrastructure/persistence/area.repository';
import { AREA_REPOSITORY } from '../common/tokens';
import { BaseCrudService } from '../common/application/base-crud.service';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class AreasService extends BaseCrudService<
  Area,
  CreateAreaDto,
  UpdateAreaDto,
  FindAllAreasDto
> {
  constructor(
    @Inject(AREA_REPOSITORY) protected readonly repo: AreaRepository,
  ) {
    super(repo);
  }

  async findAllPaginated(filter?: FindAllAreasDto): Promise<Paginated<Area>> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 10;
    
    // Usar el método findAll heredado para obtener todos los registros
    const allItems = await this.findAll(filter);
    
    // Crear respuesta paginada
    return new Paginated(allItems, allItems.length, page, limit);
  }
}
