import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';
import { ThermalPrinter } from '../../../../domain/thermal-printer';
import { FindAllThermalPrintersDto } from '../../../../dto/find-all-thermal-printers.dto';
import { ThermalPrinterRepository } from '../../thermal-printer.repository';
import { ThermalPrinterEntity } from '../entities/thermal-printer.entity';
import { ThermalPrinterMapper } from '../mappers/thermal-printer.mapper';
import { DeepPartial } from '../../../../../utils/types/deep-partial.type';

@Injectable()
export class ThermalPrintersRelationalRepository
  implements ThermalPrinterRepository
{
  constructor(
    @InjectRepository(ThermalPrinterEntity)
    private readonly printersRepository: Repository<ThermalPrinterEntity>,
  ) {}

  async create(
    data: Omit<ThermalPrinter, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<ThermalPrinter> {
    const persistenceModel = ThermalPrinterMapper.toEntity(
      data as ThermalPrinter,
    );
    const newEntity = await this.printersRepository.save(
      this.printersRepository.create(persistenceModel),
    );
    const completeEntity = await this.printersRepository.findOne({
      where: { id: newEntity.id },
    });
    if (!completeEntity) {
      throw new Error(
        `Failed to load created thermal printer with ID ${newEntity.id}`,
      );
    }
    return ThermalPrinterMapper.toDomain(completeEntity);
  }

  async findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllThermalPrintersDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[ThermalPrinter[], number]> {
    const where: FindOptionsWhere<ThermalPrinterEntity> = {};

    if (filterOptions?.name) {
      where.name = ILike(`%${filterOptions.name}%`);
    }
    if (filterOptions?.connectionType) {
      where.connectionType = filterOptions.connectionType;
    }
    if (filterOptions?.isActive !== undefined) {
      where.isActive = filterOptions.isActive;
    }

    const [entities, count] = await this.printersRepository.findAndCount({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
      where: where,
      order: { name: 'ASC' },
    });

    const printers = entities.map((printer) =>
      ThermalPrinterMapper.toDomain(printer),
    );
    return [printers, count];
  }

  async findById(
    id: ThermalPrinter['id'],
  ): Promise<NullableType<ThermalPrinter>> {
    const entity = await this.printersRepository.findOne({
      where: { id },
    });

    return entity ? ThermalPrinterMapper.toDomain(entity) : null;
  }

  async findByName(
    name: ThermalPrinter['name'],
  ): Promise<NullableType<ThermalPrinter>> {
    const entity = await this.printersRepository.findOne({
      where: { name },
    });

    return entity ? ThermalPrinterMapper.toDomain(entity) : null;
  }

  async findByIpAddress(
    ipAddress: ThermalPrinter['ipAddress'],
  ): Promise<NullableType<ThermalPrinter>> {
    if (!ipAddress) {
      return null;
    }
    const entity = await this.printersRepository.findOne({
      where: { ipAddress },
    });

    return entity ? ThermalPrinterMapper.toDomain(entity) : null;
  }

  async update(
    id: ThermalPrinter['id'],
    payload: DeepPartial<ThermalPrinter>,
  ): Promise<ThermalPrinter | null> {
    const entity = await this.printersRepository.findOne({ where: { id } });

    if (!entity) {
      return null;
    }

    const updatedEntityData = this.printersRepository.merge(entity, payload);

    const savedEntity = await this.printersRepository.save(updatedEntityData);

    const reloadedEntity = await this.printersRepository.findOne({
      where: { id: savedEntity.id },
    });

    if (!reloadedEntity) {
      throw new Error(`Failed to reload printer with ID ${id} after update.`);
    }

    return ThermalPrinterMapper.toDomain(reloadedEntity);
  }

  async remove(id: ThermalPrinter['id']): Promise<void> {
    const result = await this.printersRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Thermal printer with ID ${id} not found.`);
    }
  }
}
