import { IBaseRepository } from '../../../common/domain/repositories/base.repository';
import { Adjustment } from '../../domain/adjustment';
import { CreateAdjustmentDto } from '../../dto/create-adjustment.dto';
import { FindAllAdjustmentsDto } from '../../dto/find-all-adjustments.dto';
import { UpdateAdjustmentDto } from '../../dto/update-adjustment.dto';

export abstract class AdjustmentRepository extends IBaseRepository<
  Adjustment,
  FindAllAdjustmentsDto,
  CreateAdjustmentDto,
  UpdateAdjustmentDto
> {
  abstract findByOrderId(orderId: string): Promise<Adjustment[]>;
  abstract findByOrderItemId(orderItemId: string): Promise<Adjustment[]>;
  abstract calculateOrderAdjustments(orderId: string): Promise<number>;
  abstract calculateOrderItemAdjustments(orderItemId: string): Promise<number>;
}
