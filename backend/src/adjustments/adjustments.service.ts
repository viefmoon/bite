import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { BaseCrudService } from '../common/application/base-crud.service';
import { ADJUSTMENT_REPOSITORY } from '../common/tokens';
import { UserContextService } from '../common/services/user-context.service';
import { Adjustment } from './domain/adjustment';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { FindAllAdjustmentsDto } from './dto/find-all-adjustments.dto';
import { UpdateAdjustmentDto } from './dto/update-adjustment.dto';
import { AdjustmentRepository } from './infrastructure/persistence/adjustment.repository';

@Injectable()
export class AdjustmentsService extends BaseCrudService<
  Adjustment,
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
  FindAllAdjustmentsDto
> {
  constructor(
    @Inject(ADJUSTMENT_REPOSITORY)
    private readonly adjustmentRepository: AdjustmentRepository,
    private readonly userContextService: UserContextService,
  ) {
    super(adjustmentRepository);
  }

  async create(createAdjustmentDto: CreateAdjustmentDto): Promise<Adjustment> {
    // Validate that either orderId or orderItemId is provided, but not both
    if (!createAdjustmentDto.orderId && !createAdjustmentDto.orderItemId) {
      throw new BadRequestException(
        'Either orderId or orderItemId must be provided',
      );
    }

    if (createAdjustmentDto.orderId && createAdjustmentDto.orderItemId) {
      throw new BadRequestException(
        'Cannot provide both orderId and orderItemId',
      );
    }

    // Calculate amount based on percentage if needed
    let amount = createAdjustmentDto.amount || 0;
    if (createAdjustmentDto.isPercentage) {
      // For percentage adjustments, the actual amount will be calculated
      // when applied to the order/item total
      amount = createAdjustmentDto.value;
    }

    const currentUser = this.userContextService.getCurrentUser();
    if (!currentUser) {
      throw new BadRequestException('User context not found');
    }

    const adjustmentData = {
      ...createAdjustmentDto,
      amount,
      appliedById: currentUser.userId,
      appliedAt: new Date(),
    };

    return super.create(adjustmentData as CreateAdjustmentDto);
  }

  async findByOrderId(orderId: string): Promise<Adjustment[]> {
    return this.adjustmentRepository.findByOrderId(orderId);
  }

  async findByOrderItemId(orderItemId: string): Promise<Adjustment[]> {
    return this.adjustmentRepository.findByOrderItemId(orderItemId);
  }

  async calculateOrderAdjustments(orderId: string): Promise<number> {
    return this.adjustmentRepository.calculateOrderAdjustments(orderId);
  }

  async calculateOrderItemAdjustments(orderItemId: string): Promise<number> {
    return this.adjustmentRepository.calculateOrderItemAdjustments(orderItemId);
  }

  async applyBulkAdjustments(
    adjustments: CreateAdjustmentDto[],
  ): Promise<Adjustment[]> {
    const results: Adjustment[] = [];

    for (const adjustment of adjustments) {
      const created = await this.create(adjustment);
      results.push(created);
    }

    return results;
  }
}
