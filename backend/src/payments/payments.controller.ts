import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { FindAllPaymentsDto } from './dto/find-all-payments.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Payment } from './domain/payment';

@ApiTags('payments')
@Controller({ path: 'payments', version: '1' })
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pago' })
  @ApiResponse({
    status: 201,
    description: 'El pago ha sido creado exitosamente',
    type: Payment,
  })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los pagos con filtros opcionales' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos',
    type: [Payment],
  })
  findAll(@Query() findAllPaymentsDto: FindAllPaymentsDto) {
    return this.paymentsService.findAll(findAllPaymentsDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pago por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Pago encontrado',
    type: Payment,
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Obtener pagos por ID de orden' })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos para la orden especificada',
    type: [Payment],
  })
  findByOrderId(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.findByOrderId(orderId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un pago' })
  @ApiResponse({
    status: 200,
    description: 'Pago actualizado exitosamente',
    type: Payment,
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un pago' })
  @ApiResponse({
    status: 200,
    description: 'Pago eliminado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
