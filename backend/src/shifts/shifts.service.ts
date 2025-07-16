import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ShiftRepository } from './infrastructure/persistence/shift.repository';
import { Shift, ShiftStatus } from './domain/shift';
import { OpenShiftDto } from './dto/open-shift.dto';
import { CloseShiftDto } from './dto/close-shift.dto';
import { User } from '../users/domain/user';
import { RestaurantConfigService } from '../restaurant-config/restaurant-config.service';
import { OrderRepository } from '../orders/infrastructure/persistence/order.repository';
import { PaymentRepository } from '../payments/infrastructure/persistence/payment.repository';
import { toZonedTime, format } from 'date-fns-tz';
import { startOfDay } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { ORDER_REPOSITORY, PAYMENT_REPOSITORY } from '../common/tokens';
import { PaymentStatus } from '../payments/domain/payment';
import { OrderStatus } from '../orders/domain/enums/order-status.enum';

@Injectable()
export class ShiftsService {
  constructor(
    private readonly shiftRepository: ShiftRepository,
    private readonly restaurantConfigService: RestaurantConfigService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: OrderRepository,
    @Inject(PAYMENT_REPOSITORY)
    private readonly paymentRepository: PaymentRepository,
  ) {}

  /**
   * Abre un nuevo turno
   */
  async openShift(dto: OpenShiftDto, user: User): Promise<Shift> {
    // Verificar si ya hay un turno abierto (solo puede haber uno a la vez)
    const currentOpen = await this.shiftRepository.findCurrent();
    if (currentOpen) {
      throw new ConflictException(
        `Ya existe un turno abierto (${format(
          currentOpen.date,
          'dd/MM/yyyy',
        )} - Turno ${currentOpen.shiftNumber}). Debe cerrarlo antes de abrir uno nuevo.`,
      );
    }

    // Obtener configuración del restaurante
    const config = await this.restaurantConfigService.getConfig();
    const timeZone = config.timeZone || 'America/Mexico_City';

    // Determinar la fecha del turno
    let operationalDate: Date;
    if (dto.date) {
      operationalDate = new Date(dto.date);
    } else {
      const now = new Date();
      const localNow = toZonedTime(now, timeZone);
      operationalDate = startOfDay(localNow);
    }

    // Obtener todos los turnos de esa fecha para calcular el número de turno
    const shiftsForDate =
      await this.shiftRepository.findAllByDate(operationalDate);

    // Calcular el número de turno (shift)
    const shiftNumber = shiftsForDate.length + 1;

    // Obtener el siguiente número global de turno
    const globalShiftNumber =
      await this.shiftRepository.getNextGlobalShiftNumber();

    // Crear el nuevo turno
    const shift = new Shift();
    shift.id = uuidv4();
    shift.date = operationalDate;
    shift.globalShiftNumber = globalShiftNumber;
    shift.shiftNumber = shiftNumber;
    shift.openedAt = new Date();
    shift.openedBy = user;
    shift.initialCash = dto.initialCash;
    shift.status = ShiftStatus.OPEN;
    shift.notes = dto.notes || null;
    shift.closedAt = null;
    shift.closedBy = null;
    shift.finalCash = null;
    shift.totalSales = null;
    shift.totalOrders = null;
    shift.cashDifference = null;
    shift.closeNotes = null;
    shift.createdAt = new Date();
    shift.updatedAt = new Date();
    shift.deletedAt = null;

    return this.shiftRepository.create(shift);
  }

  /**
   * Cierra el turno actual
   */
  async closeShift(dto: CloseShiftDto, user: User): Promise<Shift> {
    // Obtener el turno actual
    const currentShift = await this.shiftRepository.findCurrent();
    if (!currentShift) {
      throw new NotFoundException('No hay un turno abierto');
    }

    // Verificar si hay órdenes abiertas
    const openOrders = await this.orderRepository.findByStatus([
      OrderStatus.IN_PROGRESS,
      OrderStatus.IN_PREPARATION,
      OrderStatus.READY,
      OrderStatus.DELIVERED,
    ]);

    if (openOrders.length > 0) {
      throw new BadRequestException(
        `No se puede cerrar el turno. Hay ${openOrders.length} órdenes abiertas que deben ser completadas o canceladas.`,
      );
    }

    // Calcular totales del turno
    const shiftStart = currentShift.openedAt;
    const shiftEnd = new Date();

    // Obtener todas las órdenes del turno
    const orders = await this.orderRepository.findByShiftId(currentShift.id);
    
    // Para ventas totales, solo contar las órdenes completadas/cobradas
    const completedOrders = orders.filter(
      (order) => order.orderStatus === OrderStatus.COMPLETED ||
                 order.orderStatus === OrderStatus.DELIVERED
    );

    // Calcular total de ventas
    const totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    // Calcular ventas en efectivo para el cuadre de caja
    const cashPayments = await this.paymentRepository.findByDateRange(
      shiftStart,
      shiftEnd,
    );
    const cashSales = cashPayments
      .filter(
        (payment) =>
          payment.paymentStatus === PaymentStatus.COMPLETED &&
          payment.paymentMethod === 'CASH',
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Calcular efectivo esperado y diferencia
    const expectedCash = currentShift.initialCash + cashSales;
    const cashDifference = dto.finalCash - expectedCash;

    // Actualizar el turno
    const updatedShift = await this.shiftRepository.update(currentShift.id, {
      closedAt: shiftEnd,
      closedBy: user,
      finalCash: dto.finalCash,
      totalSales: totalSales,
      totalOrders: orders.length, // Contar TODAS las órdenes
      cashDifference: cashDifference,
      status: ShiftStatus.CLOSED,
      closeNotes: dto.closeNotes || null,
      updatedAt: new Date(),
    });

    if (!updatedShift) {
      throw new Error('Error al actualizar el turno');
    }

    return updatedShift;
  }

  /**
   * Obtiene el turno actual
   */
  async getCurrentShift(): Promise<Shift | null> {
    return this.shiftRepository.findCurrent();
  }


  /**
   * Verifica si hay un turno abierto
   */
  async isShiftOpen(): Promise<boolean> {
    const currentShift = await this.getCurrentShift();
    return currentShift !== null && currentShift.isOpen();
  }

  /**
   * Obtiene el resumen del turno actual o por ID
   */
  async getShiftSummary(id?: string): Promise<Shift> {
    let shift: Shift | null;

    if (id) {
      shift = await this.shiftRepository.findById(id);
    } else {
      shift = await this.shiftRepository.findCurrent();
    }

    if (!shift) {
      throw new NotFoundException('Turno no encontrado');
    }

    // Si el turno está cerrado, ya tiene todos los totales calculados
    if (shift.isClosed()) {
      return shift;
    }

    // Si está abierto, calcular totales en tiempo real
    // Obtener TODAS las órdenes del turno
    const orders = await this.orderRepository.findByShiftId(shift.id);
    
    // Para ventas totales, solo contar las órdenes completadas/cobradas
    const completedOrders = orders.filter(
      (order) => order.orderStatus === OrderStatus.COMPLETED ||
                 order.orderStatus === OrderStatus.DELIVERED
    );

    // Calcular total de ventas (solo de órdenes completadas)
    shift.totalSales = completedOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );
    
    // Contar TODAS las órdenes (incluyendo las en progreso)
    shift.totalOrders = orders.length;

    return shift;
  }

  /**
   * Obtiene el histórico de turnos
   */
  async getHistory(limit: number = 30, offset: number = 0): Promise<Shift[]> {
    // Obtener todos los turnos (abiertos y cerrados)
    const openShifts = await this.shiftRepository.findByStatus(ShiftStatus.OPEN);
    const closedShifts = await this.shiftRepository.findByStatus(ShiftStatus.CLOSED);
    
    // Para los turnos abiertos, calcular estadísticas en tiempo real
    const openShiftsWithStats = await Promise.all(
      openShifts.map(async (shift) => {
        const shiftStart = shift.openedAt;
        const shiftEnd = new Date();
        
        // Obtener TODAS las órdenes del turno (no solo las completadas)
        const orders = await this.orderRepository.findByShiftId(shift.id);
        
        // Para ventas totales, solo contar las órdenes completadas/cobradas
        const completedOrders = orders.filter(
          (order) => order.orderStatus === OrderStatus.COMPLETED ||
                     order.orderStatus === OrderStatus.DELIVERED
        );
        
        shift.totalSales = completedOrders.reduce(
          (sum, order) => sum + Number(order.total),
          0,
        );
        shift.totalOrders = orders.length; // Contar TODAS las órdenes
        
        return shift;
      })
    );
    
    // Combinar y ordenar por fecha descendente
    const allShifts = [...openShiftsWithStats, ...closedShifts].sort((a, b) => 
      b.openedAt.getTime() - a.openedAt.getTime()
    );
    
    return allShifts.slice(offset, offset + limit);
  }

  /**
   * Calcula el efectivo esperado para el turno actual
   */
  async calculateExpectedCash(): Promise<number> {
    const currentShift = await this.getCurrentShift();
    if (!currentShift) {
      throw new NotFoundException('No hay un turno abierto');
    }

    const shiftStart = currentShift.openedAt;
    const shiftEnd = new Date();

    // Obtener pagos en efectivo del turno
    const cashPayments = await this.paymentRepository.findByDateRange(
      shiftStart,
      shiftEnd,
    );
    const cashSales = cashPayments
      .filter(
        (payment) =>
          payment.paymentStatus === PaymentStatus.COMPLETED &&
          payment.paymentMethod === 'CASH',
      )
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    return currentShift.initialCash + cashSales;
  }
}
