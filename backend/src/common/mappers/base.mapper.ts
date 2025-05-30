export interface IMapper<E, D> {
    toDomain(entity: E): D | null;
    toEntity(domain: D): E | null;
  }
  
  export abstract class BaseMapper<E, D> implements IMapper<E, D> {
    abstract toDomain(entity: E): D | null;
    abstract toEntity(domain: D): E | null;
  
    /** Utilidad mínima – evita repetir checks de null/undefined */
    protected isEmpty(value: unknown): boolean {
      return value === undefined || value === null;
    }
  }
  
  /** Para convertir arrays sin repetir filter(Boolean) */
  export const mapArray = <F, T>(
    items: F[] | null | undefined,
    mapper: (item: F) => T | null,
  ): T[] =>
    (items ?? [])
      .map(mapper)
      .filter((x): x is T => x !== null);