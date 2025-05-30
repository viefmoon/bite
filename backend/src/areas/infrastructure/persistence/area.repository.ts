import { Area } from '../../domain/area';
import { IBaseRepository } from '../../../common/domain/repositories/base.repository';
import { FindAllAreasDto } from '../../dto/find-all-areas.dto';
import { CreateAreaDto } from '../../dto/create-area.dto';
import { UpdateAreaDto } from '../../dto/update-area.dto';

export interface AreaRepository
  extends IBaseRepository<
    Area,
    FindAllAreasDto,
    CreateAreaDto,
    UpdateAreaDto
  > {
}
