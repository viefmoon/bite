/**
 * Utilidades robustas para conversión de tipos
 * Maneja las inconsistencias entre backend y frontend de forma segura
 */

/**
 * Convierte un valor a número de forma segura
 * Maneja strings, números y valores nulos/undefined
 */
export const toSafeNumber = (value: unknown): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  return 0;
};

/**
 * Convierte un valor a string de forma segura
 */
export const toSafeString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

/**
 * Convierte un valor a fecha de forma segura
 */
export const toSafeDate = (value: unknown): Date | null => {
  if (!value) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
};

/**
 * Convierte un valor booleano de forma segura
 */
export const toSafeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  return false;
};

/**
 * Formatea un número como dinero
 */
export const formatMoney = (amount: unknown): string => {
  const numAmount = toSafeNumber(amount);
  return `$${numAmount.toFixed(2)}`;
};

/**
 * Valida si un objeto tiene las propiedades requeridas
 */
export const hasRequiredProperties = <T extends Record<string, unknown>>(
  obj: unknown,
  requiredProps: (keyof T)[],
): obj is T => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  return requiredProps.every(
    (prop) => obj.hasOwnProperty(prop) && (obj as any)[prop] !== undefined,
  );
};
