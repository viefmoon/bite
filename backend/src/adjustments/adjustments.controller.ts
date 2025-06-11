import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
import { FindAllAdjustmentsDto } from './dto/find-all-adjustments.dto';
import { Adjustment } from './domain/adjustment';
import { InfinityPaginationResponseDto } from '../utils/dto/infinity-pagination-response.dto';
import { infinityPagination } from '../utils/infinity-pagination';

@ApiTags('Adjustments')
@Controller({
  path: 'adjustments',
  version: '1',
})
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AdjustmentsController {
  constructor(private readonly adjustmentsService: AdjustmentsService) {}

  @Post()
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Create a new adjustment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Adjustment created successfully',
    type: Adjustment,
  })
  async create(
    @Body() createAdjustmentDto: CreateAdjustmentDto,
  ): Promise<Adjustment> {
    return this.adjustmentsService.create(createAdjustmentDto);
  }

  @Post('bulk')
  @Roles(RoleEnum.admin, RoleEnum.user)
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

  @Get()
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get all adjustments with pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of adjustments',
    type: InfinityPaginationResponseDto,
  })
  async findAll(
    @Query() query: FindAllAdjustmentsDto,
  ): Promise<InfinityPaginationResponseDto<Adjustment>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;

    // For now, using simple findAll without pagination
    const items = await this.adjustmentsService.findAll(query);

    // Simple pagination simulation
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedItems = items.slice(startIndex, endIndex);

    return infinityPagination(paginatedItems, { page, limit });
  }

  @Get('order/:orderId')
  @Roles(RoleEnum.admin, RoleEnum.user)
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
  @Roles(RoleEnum.admin, RoleEnum.user)
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

  @Get('order/:orderId/total')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Calculate total adjustments for an order' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Total adjustment amount',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
      },
    },
  })
  async calculateOrderTotal(
    @Param('orderId') orderId: string,
  ): Promise<{ total: number }> {
    const total =
      await this.adjustmentsService.calculateOrderAdjustments(orderId);
    return { total };
  }

  @Get('order-item/:orderItemId/total')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Calculate total adjustments for an order item' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Total adjustment amount',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
      },
    },
  })
  async calculateOrderItemTotal(
    @Param('orderItemId') orderItemId: string,
  ): Promise<{ total: number }> {
    const total =
      await this.adjustmentsService.calculateOrderItemAdjustments(orderItemId);
    return { total };
  }

  @Get(':id')
  @Roles(RoleEnum.admin, RoleEnum.user)
  @ApiOperation({ summary: 'Get adjustment by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Adjustment details',
    type: Adjustment,
  })
  async findOne(@Param('id') id: string): Promise<Adjustment> {
    return this.adjustmentsService.findOne(id);
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
