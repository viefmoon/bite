import { Injectable, Inject } from '@nestjs/common';
import { Area } from './domain/area';
import { CreateAreaDto } from './dto/create-area.dto';
import { FindAllAreasDto } from './dto/find-all-areas.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { AreaRepository } from './infrastructure/persistence/area.repository';
import { AREA_REPOSITORY } from '../common/tokens';
import { BaseCrudService } from '../common/application/base-crud.service';

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
}
