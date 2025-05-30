import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { TicketImpression } from './domain/ticket-impression';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';

@ApiTags('Order Ticket Impressions')
@Controller({
  path: 'orders/:orderId/ticket-impressions',
  version: '1',
})
export class TicketImpressionsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin, RoleEnum.user)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Obtener todas las impresiones de tickets para una orden específica',
  })
  @ApiParam({ name: 'orderId', description: 'ID de la orden', type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de impresiones de tickets para la orden.',
    type: [TicketImpression],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden no encontrada.',
  })
  findAllByOrderId(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<TicketImpression[]> {
    return this.ordersService.findImpressionsByOrderId(orderId);
  }

}
