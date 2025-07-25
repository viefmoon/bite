import { format, parse, setHours, setMinutes, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Helpers seguros para manejo de fechas/horas en React Native con Hermes
 * Evita conversiones aritméticas que causan pérdida de precisión
 */

/**
 * Convierte un string de hora (HH:mm) a un objeto Date seguro
 * @param timeString - String en formato HH:mm
 * @param baseDate - Fecha base opcional (por defecto hoy)
 * @returns Date con la hora configurada
 */
export const safeTimeStringToDate = (
  timeString: string,
  baseDate?: Date,
): Date => {
  // Validar formato
  if (!timeString || !timeString.match(/^\d{2}:\d{2}$/)) {
    throw new Error('Formato de hora inválido. Use HH:mm');
  }

  const [hourStr, minuteStr] = timeString.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // Validar rangos
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error('Hora o minutos fuera de rango');
  }

  // Usar date-fns para operaciones seguras
  let date = baseDate ? new Date(baseDate) : new Date();
  date = setHours(date, hour);
  date = setMinutes(date, minute);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date;
};

/**
 * Convierte un Date a string de hora (HH:mm) de forma segura
 * @param date - Objeto Date
 * @returns String en formato HH:mm
 */
export const safeDateToTimeString = (date: Date): string => {
  if (!date || !isValid(date)) {
    throw new Error('Fecha inválida');
  }

  return format(date, 'HH:mm');
};

/**
 * Crea una fecha programada combinando fecha y hora de forma segura
 * @param dateStr - String de fecha (yyyy-MM-dd) o Date
 * @param timeStr - String de hora (HH:mm)
 * @returns Date con fecha y hora combinadas
 */
export const createScheduledDateTime = (
  dateStr: string | Date,
  timeStr: string,
): Date => {
  let baseDate: Date;

  if (typeof dateStr === 'string') {
    // Parsear fecha string de forma segura
    baseDate = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (!isValid(baseDate)) {
      throw new Error('Fecha inválida');
    }
  } else {
    baseDate = new Date(dateStr);
  }

  return safeTimeStringToDate(timeStr, baseDate);
};

/**
 * Formatea una fecha para mostrar de forma amigable
 * @param date - Fecha a formatear
 * @param includeTime - Si incluir la hora
 * @returns String formateado
 */
export const formatDateTimeDisplay = (
  date: Date,
  includeTime: boolean = true,
): string => {
  if (!date || !isValid(date)) {
    return '';
  }

  if (includeTime) {
    return format(date, "d 'de' MMMM 'a las' HH:mm", { locale: es });
  }

  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
};

/**
 * Obtiene el timestamp de una fecha de forma segura para enviar al backend
 * @param date - Fecha a convertir
 * @returns ISO string seguro
 */
export const getDateTimeForBackend = (date: Date): string => {
  if (!date || !isValid(date)) {
    throw new Error('Fecha inválida para backend');
  }

  // Usar toISOString() que es seguro en Hermes
  return date.toISOString();
};

/**
 * Parsea una fecha del backend de forma segura
 * @param dateStr - String de fecha del backend
 * @returns Date parseado o null si es inválido
 */
export const parseDateFromBackend = (
  dateStr: string | null | undefined,
): Date | null => {
  if (!dateStr) {
    return null;
  }

  try {
    const date = new Date(dateStr);
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
};

/**
 * Redondea minutos al múltiplo de 5 más cercano
 * @param minutes - Minutos a redondear
 * @returns Minutos redondeados
 */
export const roundMinutesToFive = (minutes: number): number => {
  // Evitar operaciones aritméticas directas
  const quotient = Math.floor(minutes / 5);
  const remainder = minutes - quotient * 5;

  if (remainder >= 3) {
    return (quotient + 1) * 5;
  }

  return quotient * 5;
};

/**
 * Valida si una fecha/hora está en el futuro
 * @param date - Fecha a validar
 * @returns true si está en el futuro
 */
export const isFutureDateTime = (date: Date): boolean => {
  if (!date || !isValid(date)) {
    return false;
  }

  const now = new Date();
  return date.getTime() > now.getTime();
};

/**
 * Obtiene la próxima hora disponible para programación (redondeada a 5 minutos)
 * @param minimumMinutesAhead - Minutos mínimos en el futuro (default: 30)
 * @returns Date con la próxima hora disponible
 */
export const getNextAvailableTime = (
  minimumMinutesAhead: number = 30,
): Date => {
  const now = new Date();

  // Añadir minutos mínimos
  const futureTime = new Date(now.getTime() + minimumMinutesAhead * 60 * 1000);

  // Redondear minutos
  const roundedMinutes = roundMinutesToFive(futureTime.getMinutes());

  let result = setMinutes(futureTime, roundedMinutes);
  result.setSeconds(0);
  result.setMilliseconds(0);

  // Si el redondeo nos llevó al pasado, añadir 5 minutos más
  if (result.getTime() <= now.getTime()) {
    result = new Date(result.getTime() + 5 * 60 * 1000);
  }

  return result;
};
