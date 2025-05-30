import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { ThermalPrinter } from '../../domain/thermal-printer';
import { FindAllThermalPrintersDto } from '../../dto/find-all-thermal-printers.dto';

export abstract class ThermalPrinterRepository {
  abstract create(
    data: Omit<ThermalPrinter, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<ThermalPrinter>;

  abstract findManyWithPagination({
    filterOptions,
    paginationOptions,
  }: {
    filterOptions?: FindAllThermalPrintersDto | null;
    paginationOptions: IPaginationOptions;
  }): Promise<[ThermalPrinter[], number]>;

  abstract findById(
    id: ThermalPrinter['id'],
  ): Promise<NullableType<ThermalPrinter>>;

  abstract findByName(
    name: ThermalPrinter['name'],
  ): Promise<NullableType<ThermalPrinter>>;

  abstract findByIpAddress(
    ipAddress: ThermalPrinter['ipAddress'],
  ): Promise<NullableType<ThermalPrinter>>;

  abstract update(
    id: ThermalPrinter['id'],
    payload: DeepPartial<ThermalPrinter>,
  ): Promise<ThermalPrinter | null>;

  abstract remove(id: ThermalPrinter['id']): Promise<void>;
}
