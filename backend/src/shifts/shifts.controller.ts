import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/domain/user';
import { ShiftsService } from './shifts.service';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { ShiftSummaryDto } from './dto/shift-summary.dto';
import { Shift } from './domain/shift';

@ApiTags('shifts')
@Controller({ path: 'shifts', version: '1' })
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post('open')
  @ApiOperation({
    summary: 'Abrir un nuevo turno',
    description:
      'Abre un nuevo turno. Solo puede haber un turno abierto a la vez.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Turno abierto exitosamente',
    type: ShiftSummaryDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Ya existe un turno abierto',
  })
  @Roles(RoleEnum.admin, RoleEnum.manager)
  @HttpCode(HttpStatus.CREATED)
  async openShift(
    @Body() dto: OpenShiftDto,
    @CurrentUser() user: User,
  ): Promise<ShiftSummaryDto> {
    const shift = await this.shiftsService.openShift(dto, user);
    return this.mapToSummaryDto(shift);
  }

  @Post('close')
  @ApiOperation({
    summary: 'Cerrar el turno actual',
    description:
      'Cierra el turno actual, registrando el efectivo final y calculando diferencias.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno cerrado exitosamente',
    type: ShiftSummaryDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No hay un turno abierto',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Hay órdenes abiertas que deben ser completadas',
  })
  @Roles(RoleEnum.admin, RoleEnum.manager)
  async closeShift(
    @Body() dto: CloseShiftDto,
    @CurrentUser() user: User,
  ): Promise<ShiftSummaryDto> {
    const shift = await this.shiftsService.closeShift(dto, user);
    return this.mapToSummaryDto(shift);
  }

  @Get('current')
  @ApiOperation({
    summary: 'Obtener el turno actual',
    description:
      'Devuelve el turno actualmente abierto, o null si no hay ninguno.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno actual',
    type: ShiftSummaryDto,
  })
  @Roles(RoleEnum.admin, RoleEnum.manager, RoleEnum.cashier, RoleEnum.waiter)
  async getCurrentShift(): Promise<ShiftSummaryDto | null> {
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      return null;
    }

    // Si está abierto, obtener el resumen con totales en tiempo real
    const summary = await this.shiftsService.getShiftSummary();
    const dto = this.mapToSummaryDto(summary);

    // Si está abierto, calcular el efectivo esperado
    if (currentShift.isOpen()) {
      dto.expectedCash = await this.shiftsService.calculateExpectedCash();
    }

    return dto;
  }

  @Get('history')
  @ApiOperation({
    summary: 'Obtener historial de turnos',
    description:
      'Devuelve el historial de turnos cerrados, ordenados por fecha descendente.'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Número de registros a devolver',
    example: 30,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Número de registros a saltar',
    example: 0,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de turnos',
    type: [ShiftSummaryDto],
  })
  @Roles(RoleEnum.admin, RoleEnum.manager)
  async getHistory(
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ): Promise<ShiftSummaryDto[]> {
    const shifts = await this.shiftsService.getHistory(limit, offset);
    return shifts.map((shift) => this.mapToSummaryDto(shift));
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un turno por ID',
    description: 'Devuelve los detalles de un turno específico.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Turno encontrado',
    type: ShiftSummaryDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Turno no encontrado',
  })
  @Roles(RoleEnum.admin, RoleEnum.manager)
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ShiftSummaryDto> {
    const shift = await this.shiftsService.getShiftSummary(id);
    return this.mapToSummaryDto(shift);
  }

  private mapToSummaryDto(shift: Shift): ShiftSummaryDto {
    return {
      id: shift.id,
      date: shift.date,
      globalShiftNumber: shift.globalShiftNumber,
      shiftNumber: shift.shiftNumber,
      status: shift.status,
      openedAt: shift.openedAt,
      closedAt: shift.closedAt,
      openedBy: {
        id: shift.openedBy.id,
        firstName: shift.openedBy.firstName || '',
        lastName: shift.openedBy.lastName || '',
      },
      closedBy: shift.closedBy
        ? {
            id: shift.closedBy.id,
            firstName: shift.closedBy.firstName || '',
            lastName: shift.closedBy.lastName || '',
          }
        : null,
      initialCash: shift.initialCash,
      finalCash: shift.finalCash,
      totalSales: shift.totalSales,
      totalOrders: shift.totalOrders,
      cashDifference: shift.cashDifference,
      notes: shift.notes,
      closeNotes: shift.closeNotes,
    };
  }
}
