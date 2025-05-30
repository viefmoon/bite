import { Repository, DeepPartial, FindOptionsWhere, ObjectLiteral } from 'typeorm';
import { IBaseRepository } from '../../../domain/repositories/base.repository';
import { NullableType } from '../../../../utils/types/nullable.type';

/**
 * Implementación genérica de un repositorio relacional sin paginación.
 *
 * @template E  Entidad TypeORM
 * @template D  Entidad de dominio
 * @template F  DTO de filtros usados en findAll
 */
export abstract class BaseRelationalRepository<
  E extends ObjectLiteral,
  D extends { id: unknown },
  F = Partial<D>,
  C = DeepPartial<D>,
  U = DeepPartial<D>,
> implements IBaseRepository<D, F, C, U>
{
  protected constructor(
    protected readonly ormRepo: Repository<E>,
    protected readonly mapper: {
      toDomain(entity: E): D | null;
      toEntity(domain: D): E | null;
    },
  ) {}

  async create(data: C): Promise<D> {
    const entity = this.mapper.toEntity(data as unknown as D);
    const saved = await this.ormRepo.save(entity as unknown as DeepPartial<E>);
    return this.mapper.toDomain(saved as E)!;
  }

  async findById(id: D['id']): Promise<NullableType<D>> {
    const found = await this.ormRepo.findOne({
      where: { id } as unknown as FindOptionsWhere<E>,
    });
    return found ? this.mapper.toDomain(found as E) : null;
  }

  async findAll(filter?: F): Promise<D[]> {
    const where = this.buildWhere(filter);
    const entities = await this.ormRepo.find({ where });
    return entities
      .map((e) => this.mapper.toDomain(e as E))
      .filter((d): d is D => d !== null);
  }

  async update(id: D['id'], payload: U): Promise<NullableType<D>> {
    const entity = await this.ormRepo.findOne({
      where: { id } as unknown as FindOptionsWhere<E>,
    });
    if (!entity) return null;

    // Asegúrate de que el payload no sobrescriba el ID existente
    const updatePayload = { ...payload, id: undefined };

    await this.ormRepo.save({ ...(entity as any), ...(updatePayload as any) });
    const updated = await this.ormRepo.findOne({
      where: { id } as unknown as FindOptionsWhere<E>,
    });
    return updated ? this.mapper.toDomain(updated as E) : null;
  }


  async remove(id: D['id']): Promise<void> {
    await this.ormRepo.softDelete(id as any);
  }

  /**
   *     Cada repositorio concreto puede sobre-escribir este
   *     método para convertir el DTO de filtros en un objeto
   *     `where` de TypeORM.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected buildWhere(_filter?: F): FindOptionsWhere<E> | undefined {
    return undefined;
  }
}