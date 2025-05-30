import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PrintingService } from './printing.service';
import { PrintOrderDto } from './dto/print-order.dto';

@ApiTags('Printing')
@Controller({
  path: 'print',
  version: '1',
})
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Post('order')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Enviar una orden a imprimir en una impresora térmica',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'La solicitud de impresión ha sido aceptada.',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Orden o impresora no encontrada.',
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Error interno del servidor durante la impresión.',
  })
  async printKitchenTicket(
    @Body() printOrderDto: PrintOrderDto,
  ): Promise<{ message: string }> {
    await this.printingService.printKitchenTicket(printOrderDto);
    return { message: 'Solicitud de impresión de cocina aceptada.' };
  }
}
