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
  async openDay(
    @Body() dto: OpenShiftDto,
    @CurrentUser() user: User,
  ): Promise<ShiftSummaryDto> {
    const shift = await this.shiftsService.openDay(dto, user);
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
  async closeDay(
    @Body() dto: CloseShiftDto,
    @CurrentUser() user: User,
  ): Promise<ShiftSummaryDto> {
    const shift = await this.shiftsService.closeDay(dto, user);
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
  async getCurrentDay(): Promise<ShiftSummaryDto | null> {
    const currentShift = await this.shiftsService.getCurrentShift();
    if (!currentShift) {
      return null;
    }

    // Si está abierto, obtener el resumen con totales en tiempo real
    const summary = await this.shiftsService.getDaySummary();
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
    const days = await this.shiftsService.getHistory(limit, offset);
    return days.map((day) => this.mapToSummaryDto(day));
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
    const day = await this.shiftsService.getDaySummary(id);
    return this.mapToSummaryDto(day);
  }

  private mapToSummaryDto(day: Shift): ShiftSummaryDto {
    return {
      id: day.id,
      date: day.date,
      globalShiftNumber: day.globalShiftNumber,
      shiftNumber: day.shiftNumber,
      status: day.status,
      openedAt: day.openedAt,
      closedAt: day.closedAt,
      openedBy: {
        id: day.openedBy.id,
        firstName: day.openedBy.firstName || '',
        lastName: day.openedBy.lastName || '',
      },
      closedBy: day.closedBy
        ? {
            id: day.closedBy.id,
            firstName: day.closedBy.firstName || '',
            lastName: day.closedBy.lastName || '',
          }
        : null,
      initialCash: day.initialCash,
      finalCash: day.finalCash,
      totalSales: day.totalSales,
      totalOrders: day.totalOrders,
      cashDifference: day.cashDifference,
      notes: day.notes,
      closeNotes: day.closeNotes,
    };
  }
}
