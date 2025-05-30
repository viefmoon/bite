import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { DailyOrderCounter } from '../../../../domain/daily-order-counter';
import { DailyOrderCounterRepository } from '../../daily-order-counter.repository';
import { DailyOrderCounterEntity } from '../entities/daily-order-counter.entity';
import { DailyOrderCounterMapper } from '../mappers/daily-order-counter.mapper';

@Injectable()
export class DailyOrderCounterRelationalRepository
  implements DailyOrderCounterRepository
{
  constructor(
    @InjectRepository(DailyOrderCounterEntity)
    private readonly dailyOrderCounterRepository: Repository<DailyOrderCounterEntity>,
    private readonly dailyOrderCounterMapper: DailyOrderCounterMapper,
  ) {}

  async create(
    data: Omit<
      DailyOrderCounter,
      'id' | 'createdAt' | 'deletedAt' | 'updatedAt' | 'orders'
    >,
  ): Promise<DailyOrderCounter> {
    const persistenceModel = this.dailyOrderCounterMapper.toEntity(
      data as DailyOrderCounter,
    );
    if (!persistenceModel) {
      throw new Error('Failed to map daily order counter domain to entity');
    }
    const newEntity = await this.dailyOrderCounterRepository.save(
      this.dailyOrderCounterRepository.create(persistenceModel),
    );

    const completeEntity = await this.dailyOrderCounterRepository.findOne({
      where: { id: newEntity.id },
      relations: ['orders'],
    });

    if (!completeEntity) {
      throw new Error(
        `No se pudo cargar el contador diario creado con ID ${newEntity.id}`,
      );
    }

    const domainResult = this.dailyOrderCounterMapper.toDomain(completeEntity);
    if (!domainResult) {
      throw new Error('Failed to map complete daily order counter entity to domain');
    }
    return domainResult;
  }

  async findById(
    id: DailyOrderCounter['id'],
  ): Promise<NullableType<DailyOrderCounter>> {
    const entity = await this.dailyOrderCounterRepository.findOne({
      where: { id },
      relations: ['orders'],
    });

    return entity ? this.dailyOrderCounterMapper.toDomain(entity) : null;
  }

  async findByDate(date: Date): Promise<NullableType<DailyOrderCounter>> {
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    const entity = await this.dailyOrderCounterRepository.findOne({
      where: {
        date: searchDate,
      },
      relations: ['orders'],
    });

    return entity ? this.dailyOrderCounterMapper.toDomain(entity) : null;
  }

  async findOrCreateByDate(date: Date): Promise<DailyOrderCounter> {
    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    let counter = await this.findByDate(searchDate);

    if (!counter) {
      const newCounter = new DailyOrderCounter();
      newCounter.date = searchDate;
      newCounter.currentNumber = 0;
      counter = await this.create(newCounter);
    }

    return counter;
  }

  async incrementCounter(
    id: DailyOrderCounter['id'],
  ): Promise<DailyOrderCounter> {
    await this.dailyOrderCounterRepository.query(
      `UPDATE daily_order_counter SET "current_number" = "current_number" + 1 WHERE id = $1`,
      [id],
    );

    const updatedCounter = await this.findById(id);
    if (!updatedCounter) {
      throw new Error(
        `No se pudo encontrar el contador con ID ${id} después de incrementarlo`,
      );
    }

    return updatedCounter;
  }

  async update(
    id: DailyOrderCounter['id'],
    payload: Partial<DailyOrderCounter>,
  ): Promise<DailyOrderCounter> {
    const entity = await this.dailyOrderCounterRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new NotFoundException('Daily order counter not found');
    }

    const existingDomain = this.dailyOrderCounterMapper.toDomain(entity);
    if (!existingDomain) {
      throw new Error('Failed to map existing daily order counter entity to domain');
    }

    const updatedDomain = {
      ...existingDomain,
      ...payload,
    };

    const persistenceModel = this.dailyOrderCounterMapper.toEntity(updatedDomain);
    if (!persistenceModel) {
      throw new Error('Failed to map updated daily order counter domain to entity');
    }

    const updatedEntity = await this.dailyOrderCounterRepository.save(
      this.dailyOrderCounterRepository.create(persistenceModel),
    );

    const completeEntity = await this.dailyOrderCounterRepository.findOne({
      where: { id: updatedEntity.id },
      relations: ['orders'],
    });

    if (!completeEntity) {
      throw new Error(
        `No se pudo cargar el contador actualizado con ID ${updatedEntity.id}`,
      );
    }

    const finalDomainResult = this.dailyOrderCounterMapper.toDomain(completeEntity);
    if (!finalDomainResult) {
      throw new Error('Failed to map final updated daily order counter entity to domain');
    }
    return finalDomainResult;
  }

  async remove(id: DailyOrderCounter['id']): Promise<void> {
    await this.dailyOrderCounterRepository.softDelete(id);
  }
}
