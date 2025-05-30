import { NullableType } from '../../../utils/types/nullable.type';
import { DeepPartial } from '../../../utils/types/deep-partial.type';

/**
 * Interfaz base genérica para repositorios.
 * Define operaciones CRUD comunes sin paginación.
 *
 * @template TDomain - El tipo de la entidad de dominio.
 * @template TFilterDto - El DTO para filtros en findAll (opcional, por defecto Partial<TDomain>).
 * @template TCreateDto - El DTO para crear la entidad (por defecto DeepPartial<TDomain>).
 * @template TUpdateDto - El DTO para actualizar la entidad (por defecto DeepPartial<TDomain>).
 */
export interface IBaseRepository<
  TDomain extends { id: unknown },
  TFilterDto = Partial<TDomain>,
  TCreateDto = DeepPartial<TDomain>,
  TUpdateDto = DeepPartial<TDomain>
> {
  /**
   * Crea una nueva entidad en el repositorio.
   * @param data - Los datos para crear la entidad (DTO de creación).
   * @returns La entidad de dominio creada.
   */
  create(data: TCreateDto): Promise<TDomain>;

  /**
   * Busca una entidad por su ID.
   * @param id - El ID de la entidad a buscar.
   * @returns La entidad de dominio encontrada o null si no existe.
   */
  findById(id: TDomain['id']): Promise<NullableType<TDomain>>;

  /**
   * Busca todas las entidades que coincidan con los filtros opcionales.
   * ¡Importante! No implementa paginación. Devuelve un array completo.
   * @param filter - (Opcional) Objeto con criterios de filtro.
   * @returns Un array con todas las entidades de dominio encontradas.
   */
  findAll(filter?: TFilterDto): Promise<TDomain[]>;

  /**
   * Actualiza una entidad existente por su ID.
   * @param id - El ID de la entidad a actualizar.
   * @param payload - Los datos a actualizar (DTO de actualización).
   * @returns La entidad de dominio actualizada o null si no se encontró la entidad original.
   */
  update(id: TDomain['id'], payload: TUpdateDto): Promise<NullableType<TDomain>>;

  /**
   * Elimina una entidad (lógica o físicamente) por su ID.
   * La implementación decidirá si es borrado lógico (soft delete) o físico.
   * @param id - El ID de la entidad a eliminar.
   */
  remove(id: TDomain['id']): Promise<void>;
}