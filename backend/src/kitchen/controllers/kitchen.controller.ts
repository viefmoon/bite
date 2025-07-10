import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../roles/roles.guard';
import { Roles } from '../../roles/roles.decorator';
import { RoleEnum } from '../../roles/roles.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { KitchenService } from '../services/kitchen.service';
import { KitchenOrderFilterDto } from '../dto/kitchen-order-filter.dto';
import { MarkItemPreparedDto } from '../dto/mark-item-prepared.dto';
import { KitchenOrderDto } from '../dto/kitchen-order-response.dto';

@ApiTags('Cocina')
@Controller({
  path: 'kitchen',
  version: '1',
})
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  @Get('orders')
  @ApiOperation({
    summary: 'Obtener órdenes para preparación en cocina',
    description:
      'Retorna las órdenes filtradas según la pantalla de preparación del usuario',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de órdenes para preparación',
    type: [KitchenOrderDto],
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async getKitchenOrders(
    @CurrentUser('id') userId: string,
    @Query() filters: KitchenOrderFilterDto,
  ): Promise<KitchenOrderDto[]> {
    return this.kitchenService.getKitchenOrders(userId, filters);
  }

  @Patch('order-items/:id/prepare')
  @ApiOperation({
    summary: 'Marcar item de orden como preparado',
    description:
      'Marca uno o varios items (si están agrupados) como preparados',
  })
  @ApiResponse({
    status: 204,
    description: 'Item marcado como preparado exitosamente',
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async markItemPrepared(
    @Param('id') itemId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: MarkItemPreparedDto,
  ): Promise<void> {
    await this.kitchenService.markItemPrepared(
      itemId,
      userId,
      dto.isPrepared ?? true,
    );
  }

  @Patch('order-items/:id/unprepare')
  @ApiOperation({
    summary: 'Desmarcar item de orden como preparado',
    description:
      'Desmarca uno o varios items (si están agrupados) como no preparados',
  })
  @ApiResponse({
    status: 204,
    description: 'Item desmarcado exitosamente',
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unmarkItemPrepared(
    @Param('id') itemId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.kitchenService.markItemPrepared(itemId, userId, false);
  }

  @Get('my-screen')
  @ApiOperation({
    summary: 'Obtener pantalla de preparación asignada al usuario',
    description:
      'Retorna la pantalla de preparación predeterminada del usuario actual',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de la pantalla asignada',
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.OK)
  async getMyScreen(@CurrentUser('id') userId: string) {
    const screen = await this.kitchenService.getUserDefaultScreen(userId);
    return { screen };
  }

  @Patch('orders/:orderId/start-preparation')
  @ApiOperation({
    summary: 'Iniciar preparación para una pantalla específica',
    description:
      'Marca el inicio de preparación de una orden para la pantalla del usuario',
  })
  @ApiResponse({
    status: 204,
    description: 'Preparación iniciada exitosamente',
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async startPreparationForScreen(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.kitchenService.startPreparationForScreen(orderId, userId);
  }

  @Patch('orders/:orderId/complete-preparation')
  @ApiOperation({
    summary: 'Completar preparación para una pantalla específica',
    description:
      'Marca como completada la preparación de una orden para la pantalla del usuario',
  })
  @ApiResponse({
    status: 204,
    description: 'Preparación completada exitosamente',
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async completePreparationForScreen(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.kitchenService.completePreparationForScreen(orderId, userId);
  }

  @Patch('orders/:orderId/cancel-preparation')
  @ApiOperation({
    summary: 'Cancelar preparación para una pantalla específica',
    description:
      'Regresa el estado de preparación de una orden para la pantalla del usuario',
  })
  @ApiResponse({
    status: 204,
    description: 'Preparación cancelada exitosamente',
  })
  @Roles(RoleEnum.kitchen, RoleEnum.admin)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelPreparationForScreen(
    @Param('orderId') orderId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.kitchenService.cancelPreparationForScreen(orderId, userId);
  }
}
