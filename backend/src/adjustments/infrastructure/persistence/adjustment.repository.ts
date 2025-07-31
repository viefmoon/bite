import { IBaseRepository } from '../../../common/domain/repositories/base.repository';
import { Adjustment } from '../../domain/adjustment';
import { CreateAdjustmentDto } from '../../dto/create-adjustment.dto';
import { FindAllAdjustmentsDto } from '../../dto/find-all-adjustments.dto';
import { UpdateAdjustmentDto } from '../../dto/update-adjustment.dto';
import { NullableType } from '../../../utils/types/nullable.type';

export abstract class AdjustmentRepository
  implements
    IBaseRepository<
      Adjustment,
      FindAllAdjustmentsDto,
      CreateAdjustmentDto,
      UpdateAdjustmentDto
    >
{
  // Métodos de IBaseRepository
  abstract create(data: CreateAdjustmentDto): Promise<Adjustment>;
  abstract findById(id: string): Promise<NullableType<Adjustment>>;
  abstract findAll(filter?: FindAllAdjustmentsDto): Promise<Adjustment[]>;
  abstract update(
    id: string,
    payload: UpdateAdjustmentDto,
  ): Promise<NullableType<Adjustment>>;
  abstract remove(id: string): Promise<void>;

  // Métodos específicos de Adjustment
  abstract findByOrderId(orderId: string): Promise<Adjustment[]>;
  abstract findByOrderItemId(orderItemId: string): Promise<Adjustment[]>;
  abstract calculateOrderAdjustments(orderId: string): Promise<number>;
  abstract calculateOrderItemAdjustments(orderItemId: string): Promise<number>;
}
