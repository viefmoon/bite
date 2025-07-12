import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShiftRepository } from '../../shift.repository';
import { ShiftEntity } from '../entities/shift.entity';
import { ShiftMapper } from '../mappers/shift.mapper';
import { Shift, ShiftStatus } from '../../../../domain/shift';

@Injectable()
export class ShiftRelationalRepository extends ShiftRepository {
  constructor(
    @InjectRepository(ShiftEntity)
    private readonly shiftRepository: Repository<ShiftEntity>,
    private readonly shiftMapper: ShiftMapper,
  ) {
    super();
  }

  async create(shift: Shift): Promise<Shift> {
    const entity = this.shiftMapper.toPersistence(shift);
    const savedEntity = await this.shiftRepository.save(entity);
    return this.shiftMapper.toDomain(savedEntity)!;
  }

  async findById(id: string): Promise<Shift | null> {
    const entity = await this.shiftRepository.findOne({
      where: { id },
      relations: ['openedBy', 'closedBy'],
    });
    return entity ? this.shiftMapper.toDomain(entity) : null;
  }

  async findByDate(date: Date): Promise<Shift | null> {
    const entity = await this.shiftRepository.findOne({
      where: { date },
      relations: ['openedBy', 'closedBy'],
    });
    return entity ? this.shiftMapper.toDomain(entity) : null;
  }

  async findAllByDate(date: Date): Promise<Shift[]> {
    const entities = await this.shiftRepository.find({
      where: { date },
      relations: ['openedBy', 'closedBy'],
      order: { openedAt: 'ASC' },
    });
    return entities
      .map((entity) => this.shiftMapper.toDomain(entity))
      .filter((shift): shift is Shift => shift !== null);
  }

  async findCurrent(): Promise<Shift | null> {
    const entity = await this.shiftRepository.findOne({
      where: { status: ShiftStatus.OPEN },
      relations: ['openedBy', 'closedBy'],
      order: { openedAt: 'DESC' },
    });
    return entity ? this.shiftMapper.toDomain(entity) : null;
  }

  async findLastClosed(): Promise<Shift | null> {
    const entity = await this.shiftRepository.findOne({
      where: { status: ShiftStatus.CLOSED },
      relations: ['openedBy', 'closedBy'],
      order: { closedAt: 'DESC' },
    });
    return entity ? this.shiftMapper.toDomain(entity) : null;
  }

  async findByStatus(status: ShiftStatus): Promise<Shift[]> {
    const entities = await this.shiftRepository.find({
      where: { status },
      relations: ['openedBy', 'closedBy'],
      order: { openedAt: 'DESC' },
    });
    return entities
      .map((entity) => this.shiftMapper.toDomain(entity))
      .filter((domain): domain is Shift => domain !== null);
  }

  async update(id: string, payload: Partial<Shift>): Promise<Shift | null> {
    await this.shiftRepository.update(id, payload as any);
    const updated = await this.findById(id);
    return updated;
  }

  async getNextBusinessDayNumber(): Promise<number> {
    const lastDays = await this.shiftRepository.find({
      order: { globalShiftNumber: 'DESC' },
      take: 1,
    });
    const lastDay = lastDays[0];
    return lastDay ? lastDay.globalShiftNumber + 1 : 1;
  }
}
