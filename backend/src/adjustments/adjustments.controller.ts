import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { AdjustmentsService } from './adjustments.service';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { UpdateAdjustmentDto } from './dto/update-adjustment.dto';
import { Adjustment } from './domain/adjustment';

@ApiTags('Adjustments')
@Controller({
  path: 'adjustments',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdjustmentsController {
  constructor(private readonly adjustmentsService: AdjustmentsService) {}

  @Post('bulk')
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier)
  @ApiOperation({ summary: 'Apply multiple adjustments' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Adjustments created successfully',
    type: [Adjustment],
  })
  async createBulk(
    @Body() createAdjustmentDtos: CreateAdjustmentDto[],
  ): Promise<Adjustment[]> {
    return this.adjustmentsService.applyBulkAdjustments(createAdjustmentDtos);
  }

  @Get('order/:orderId')
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier)
  @ApiOperation({ summary: 'Get adjustments for a specific order' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of order adjustments',
    type: [Adjustment],
  })
  async findByOrder(@Param('orderId') orderId: string): Promise<Adjustment[]> {
    return this.adjustmentsService.findByOrderId(orderId);
  }

  @Get('order-item/:orderItemId')
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier)
  @ApiOperation({ summary: 'Get adjustments for a specific order item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of order item adjustments',
    type: [Adjustment],
  })
  async findByOrderItem(
    @Param('orderItemId') orderItemId: string,
  ): Promise<Adjustment[]> {
    return this.adjustmentsService.findByOrderItemId(orderItemId);
  }

  @Patch(':id')
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Update an adjustment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Adjustment updated successfully',
    type: Adjustment,
  })
  async update(
    @Param('id') id: string,
    @Body() updateAdjustmentDto: UpdateAdjustmentDto,
  ): Promise<Adjustment> {
    const result = await this.adjustmentsService.update(
      id,
      updateAdjustmentDto,
    );
    if (!result) {
      throw new NotFoundException(`Adjustment with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Roles(RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an adjustment' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Adjustment deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.adjustmentsService.remove(id);
  }
}
