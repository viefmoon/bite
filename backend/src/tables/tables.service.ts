import { Injectable } from '@nestjs/common';
import { Table } from './domain/table';
import { CreateTableDto } from './dto/create-table.dto';
import { FindAllTablesDto } from './dto/find-all-tables.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableRepository } from './infrastructure/persistence/table.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { TABLE_REPOSITORY } from '../common/tokens';
import { Inject } from '@nestjs/common';
import { Paginated } from '../common/types/paginated.type';

@Injectable()
export class TablesService {
  constructor(
    @Inject(TABLE_REPOSITORY)
    private readonly tableRepository: TableRepository,
  ) {}

  async create(createTableDto: CreateTableDto): Promise<Table> {
    const table = new Table();
    table.name = createTableDto.name;
    table.areaId = createTableDto.areaId;
    table.capacity =
      createTableDto.capacity !== undefined ? createTableDto.capacity : null;
    table.isActive =
      createTableDto.isActive !== undefined ? createTableDto.isActive : true;
    table.isAvailable =
      createTableDto.isAvailable !== undefined
        ? createTableDto.isAvailable
        : true;
    table.isTemporary =
      createTableDto.isTemporary !== undefined
        ? createTableDto.isTemporary
        : false;
    table.temporaryIdentifier = createTableDto.temporaryIdentifier || null;

    return this.tableRepository.create(table);
  }

  async findAll(
    filterOptions: FindAllTablesDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Table[]> {
    return this.tableRepository.findManyWithPagination({
      filterOptions,
      paginationOptions,
    });
  }

  async findOne(id: string): Promise<Table> {
    const table = await this.tableRepository.findById(id);

    if (!table) {
      throw new Error('Table not found');
    }

    return table;
  }

  async findByAreaId(areaId: string): Promise<Table[]> {
    return this.tableRepository.findByAreaId(areaId);
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<Table> {
    const updatedTable = await this.tableRepository.update(id, updateTableDto);

    if (!updatedTable) {
      throw new Error('Table not found');
    }

    return updatedTable;
  }

  async remove(id: string): Promise<void> {
    return this.tableRepository.remove(id);
  }

  async findAllPaginated(
    filterOptions: FindAllTablesDto,
    paginationOptions: IPaginationOptions,
  ): Promise<Paginated<Table>> {
    const items = await this.findAll(filterOptions, paginationOptions);
    const total = items.length; // En una implementación real, deberías obtener el total de la BD

    return new Paginated(
      items,
      total,
      paginationOptions.page || 1,
      paginationOptions.limit || 10,
    );
  }

  async findByAreaIdPaginated(areaId: string): Promise<Paginated<Table>> {
    const items = await this.findByAreaId(areaId);

    return new Paginated(
      items,
      items.length,
      1, // página por defecto
      100, // límite alto por defecto para mostrar todas las mesas del área
    );
  }
}
