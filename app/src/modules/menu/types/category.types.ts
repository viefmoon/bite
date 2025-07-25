// Tipos de dominio centralizados en src/app/types/domain/

/**
 * Estructura genérica para respuestas paginadas de la API.
 * TODO: Mover a un archivo de tipos comunes de API si se usa en más módulos.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type ActiveFilter = 'all' | 'active' | 'inactive';

// Los tipos inferidos de Zod (CreateCategoryDto, UpdateCategoryDto, CategoryFormData)
// se definen y exportan directamente desde ../schema/category.schema.ts
// y se usan donde se necesiten los tipos específicos del schema/formulario.
